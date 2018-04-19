import { MongoClient, Collection } from 'mongodb';
import * as AsyncLock from 'async-lock';
import * as EventEmitter from 'events';

import * as _ from 'lodash';


// Note that messages and payloads are persisted for logging purposes and
// to recover a tx if the coordinator or one of the cohorts fails permanently.
// To pass transient information that should be associated with a message use
// the optional `state: State` value.
export interface TxConfig<Message, Payload, State = any> {
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  // msg is the original message processed
  // While the return value of these functions is ignored they should only
  // resolve to a value if the cohort responded to the commit/abort (only an
  // ACK is needed)
  sendCommitToCohort: (msg: Message) => Promise<void>;
  sendAbortToCohort: (msg: Message) => Promise<void>;
  sendVoteToCohort: (msg: Message) => Promise<Vote<Payload>>;

  /**
   * `causedAbort` is `true` if this is the client that caused the abort.
   * `payload` is `undefined` if the client never got to the point of voting.
   **/
  sendAbortToClient: (
    msg: Message, causedAbort: boolean, payload?: Payload, state?: State) => void;
  // payload is what got returned in `sendVoteToCohort`
  sendToClient: (payload: Payload, state?: State) => void;

  onError: (error: Error, msg: Message, state?: State) => void;
  getCohorts: (cohortId: string) => string[];
}

export interface Vote<Payload> {
  result: 'yes' | 'no';
  payload: Payload;
}

type TxState = (
  'voting' | 'committing' | 'committed' | 'aborting' | 'aborted');

// cohorts can be in an additional state in which they voted and are now waiting
// for a resolution
type CohortState = TxState | 'waitingForCompletion';

interface Cohort<Message, Payload> {
  id: string;
  msg?: Message;
  vote?: Vote<Payload> | undefined;
  state?: CohortState;
}

interface TxDoc<Message, Payload> {
  id: string;
  state: TxState;
  // Could be undefined if we haven't processed message from the cohort yet
  cohorts: Cohort<Message, Payload>[];
  // When the tx was started
  startedOn: Date;
}

interface Transition {
  newTxState?: 'committing' | 'aborting';
  newCohortState?: 'waitingForCompletion';
}

// The time in seconds after which a transaction stuck in voting should abort
// 10s should be the max https://www.nngroup.com/articles/website-response-times
const TX_TIMEOUT_SECONDS = 10;

/**
 *  Coordinates between a set of participants on whether to commit or abort
 *  a transaction.
 **/
export class TxCoordinator<Message, Payload, State = any> {
  // The tx id are used as the keys for locking
  private lock = new AsyncLock();
  // Each tx emits a txId-[commit | abort] event
  private completed = new EventEmitter();
  private txs: Collection<TxDoc<Message, Payload>> | undefined;

  constructor(private config: TxConfig<Message, Payload, State>) {}

  async start() {
    this.txs = await this.getTxsCollection();
    setInterval(this.timeoutAbort.bind(this), TX_TIMEOUT_SECONDS * 1000);
  }

  async processMessage(
    txId: string, cohortId: string, msg: Message, state?: State)
    : Promise<void> {
    if (!this.txs) {
      this.config.onError(
        new Error('TxCoordinator hasn\'t been started yet: call start()'),
        msg, state);
      return;
    }
    const tx: TxDoc<Message, Payload> = await this.getTx(txId, cohortId);

    // no race condition here because the set of cohorts doesn't change after
    // initialization
    // While we could deactivate this check we still need to know the expected
    // actions that make up a transaction so that we know when it's done
    const cohortIds =  _.map(tx.cohorts, 'id');
    if (!_.includes(cohortIds, cohortId)) {
      // We received a request from a cohort that is not part of the tx
      this.config.onError(
        new Error(
          `[txId: ${txId}] ${cohortId} is not part of this tx. Cohorts are ` +
          JSON.stringify(cohortIds)),
        msg, state);
      return;
    }

    // If we got here the tx has been initialized (by this msg or a previous one)
    // The tx state could be 'voting', 'aborting' or 'aborted'

    // We might still end up sending an unnecessary vote message if the tx
    // changes to abort right after we do the check but that won't cause any
    // problems. The check here is mostly to save some unnecessary votes.
    if (this.shouldAbort(tx)) {
      this.config.sendAbortToClient(msg, false, undefined, state);
      return;
    }

    // tx is 'voting'

    // Here we are using mongodb to essentially lock on the txId and cohortId
    // to detect duplicate requests and if o/w send the vote (so that we never
    // send a duplicate vote to a cohort)
    // If `cohorts.msg` is defined then this is a duplicate req
    const update = await this.txs.updateOne(
      { id: txId, 'cohorts.id': cohortId, 'cohorts.msg': undefined },
      { $set: {
        'cohorts.$.msg': msg,
        'cohorts.$.vote': undefined,
        'cohorts.$.state': 'voting'
      } });
    if (update.matchedCount == 0) { // Duplicate request
      this.config.onError(
        new Error(`[txId: ${txId}] Duplicate message from ${cohortId}`),
        msg, state);
      return;
    }
    let vote: Vote<Payload>;
    try {
      vote = await this.config.sendVoteToCohort(msg);
    } catch (e) {
      console.error(e);
      this.config.onError(
        new Error(`[txId: ${txId}] Sending vote to cohort ${cohortId} failed`),
        msg, state);
      return;
    }
    this.saveVote(txId, cohortId, vote);

    // We need to be sure that we are processing votes one by one because:
    // (i) as soon as one votes 'no' we are going to abort, and
    // (ii) when we receive the last 'yes' we are going to commit.
    const transition: Transition = await this.lock.acquire(txId, () => {
      return this.processVote(txId, cohortId, vote, () => {
          this.config.sendToClient(vote.payload, state);
      }, () => {
          this.config.sendAbortToClient(msg, false, vote.payload, state);
      });
    });

    let ret;
    if (_.isEmpty(transition)) {  // tx was already aborting
      this.config.sendAbortToClient(msg, false, vote.payload, state);
      this.completed.emit(txId + '-abort');
      ret = this.completeMessage(txId, cohortId, msg, false);
    } else if (transition.newTxState === 'committing' &&
               !transition.newCohortState) {
      this.config.sendToClient(vote.payload, state);
      this.completed.emit(txId + '-commit');
      ret = Promise.all([
        this.completeTx(txId, true),
        this.completeMessage(txId, cohortId, msg, true)]);
    } else if (!transition.newTxState &&
               transition.newCohortState === 'waitingForCompletion') {
      // nothing to do in this case since we are waiting
    } else if (transition.newTxState === 'aborting') {
      this.config.sendAbortToClient(msg, true, vote.payload, state);
      this.completed.emit(txId + '-abort');
      ret = Promise.all([
        this.completeTx(txId, false),
        this.completeMessage(txId, cohortId, msg, false)]);
    } else {
      throw new Error('Invalid transition');
    }
    return ret;
  }

  private async getTx(txId: string, cohortId: string)
    : Promise<TxDoc<Message, Payload>> {
    // Look at the tx table and create one if there's no active tx for txId
    return (await this.txs!.findOneAndUpdate(
      { id: txId },
      { $setOnInsert: {
        state: 'voting',
        startedOn: new Date(),
        // We are going to be recomputing the expected cohorts for each tx we
        // fetch but this lets us do `$setOnInsert`. We could check if the tx
        // has been initialized and if not compute the expected cohorts but we
        // would have to acquire the tx lock to do `find`, get the expected
        // cohorts, and `update` atomically.
        cohorts: _.map(
          this.config.getCohorts(cohortId),
          (cohortId: string) => ({id: cohortId}))
      } },
      { returnOriginal: false, upsert: true }))
      .value!;
  }

  private async processVote(
    txId: string, cohortId: string, vote: Vote<Payload>,
    onCommit: () => void, onAbort: () => void): Promise<Transition> {
    // Txs are never removed and if we got here we know there's a tx doc
    const tx: TxDoc<Message, Payload> = (await this.txs!.findOne({ id: txId }))!;
    const ret: Transition = {};

    if (this.shouldAbort(tx)) {
      return ret;
    }
    // We are still in the 'voting' phase. The tx can't be committing
    // because it doesn't yet have this vote

    if (vote.result === 'yes') {
      if (this.allVotedButOne(tx)) {
        // We know that all previous votes were 'yes' because if o/w the
        // state would be 'aborting'/'aborted'
        await this.updateTxState(txId, 'committing');
        ret.newTxState = 'committing';
      } else { // we are not the last one
        // wait on complete
        this.completed.on(txId + '-commit', onCommit);
        this.completed.on(txId + '-abort', onAbort);
        await this.updateCohortState(txId, cohortId, 'waitingForCompletion');
        ret.newCohortState = 'waitingForCompletion';
      }
    } else { // the vote was 'no'
      if (vote.result !== 'no') {
        console.error(
          `[txId: ${txId}] Got a vote back that was not 'yes'/'no'. The
          cliche at ${cohortId} doesn't correcly implement voting`);
      }
      // We know that all previous votes were 'yes' because if o/w the state
      // would be 'aborting'/'aborted'. Thus, we are in the 'voting' phase and
      // this is the first 'no' vote
      await Promise.all([
        this.updateCohortState(txId, cohortId, 'waitingForCompletion'),
        this.updateTxState(txId, 'aborting')]);
      ret.newTxState = 'aborting';
      ret.newCohortState = 'waitingForCompletion';
    }
    return ret;
  }

  private shouldAbort(tx: TxDoc<Message, Payload>) {
    return tx.state === 'aborting' || tx.state === 'aborted';
  }

  private allVotedButOne(tx: TxDoc<Message, Payload>): boolean {
    return _.chain(tx.cohorts)
      .map('state')
      .filter((s) => s === 'voting')
      .value()
      .length === 1;
  }

  private saveVote(txId: string, cohortId: string, vote: Vote<Payload>) {
    return this.txs!
      .updateOne(
        { id: txId, 'cohorts.id': cohortId },
        { $set: { [`cohorts.$.vote`]: vote } });
  }

  private updateCohortState(
    txId: string, cohortId: string, newState: CohortState) {
    return this.txs!
      .updateOne(
        { id: txId, 'cohorts.id': cohortId },
        { $set: { [`cohorts.$.state`]: newState } });
  }

  private updateTxState(id: string, newState: TxState) {
    return this.txs!.updateOne({ id: id }, { $set: { state: newState } });
  }

  /**
   *  Every time this function runs, it aborts active txs whose
   *  `startedOn + TX_TIMEOUT_SECONDS` time is less than the current time.
   **/
  private async timeoutAbort() {
    const threshold = new Date();
    threshold.setSeconds(threshold.getSeconds() - TX_TIMEOUT_SECONDS);
    const txsToAbort: {id: string}[] = await this.txs!.find<{id: string}>({
      state: 'voting',
      startedOn: { $lt: threshold }
    }, { projection: { id: 1 } }).toArray();

    console.log(
      `Found ${txsToAbort.length} transactions to abort due to timeout`);
    await Promise.all(
      _.map(txsToAbort, async (txToAbort: TxDoc<Message, Payload>) => {
        return this.lock.acquire(txToAbort.id, async () => {
            const tx: TxDoc<Message, Payload> = (await this.txs!
              .findOne({ id: txToAbort.id }, { projection: { state: 1 }}))!;
            if (tx.state !== 'voting') {
              return false;
            }
            console.error(`[txId: ${txToAbort.id}] Aborting due to timeout`);
            await this.updateTxState(txToAbort.id, 'aborting');
            return true;
          })
          .then((shouldCompleteTx: boolean): Promise<any> | undefined => {
            if (shouldCompleteTx) {
              return this.completeTx(txToAbort.id, false);
            }
            return;
          });
      })
    );
  }

  private completeMessage(
    txId: string, cohortId: string, msg: Message, success: boolean) {
    const completedState = success ? 'committed' : 'aborted';
    const completingState = success ? 'committing' : 'aborting';
    const send = success ? this.config.sendCommitToCohort :
      this.config.sendAbortToCohort;
    return this.updateCohortState(txId, cohortId, completingState)
      .then(unused => send(msg))
      .catch(e => {
        // TODO: handle errors
        console.error(e);
        throw new Error(
          `[txId: ${txId}] Sending commit/abort to ${cohortId} failed`);
      })
      .then(unused => this.updateCohortState(txId, cohortId, completedState));
  }

  private async completeTx(txId: string, success: boolean) {
    const completedState = success ? 'committed' : 'aborted';
    const tx: { cohorts: { id: string, msg?: Message }[] }= (await this.txs!
      .findOne({ id: txId }, {
        projection: { 'cohorts.msg': 1, 'cohorts.id': 1 }}))!;
    await Promise.all(
      _.map(
        tx.cohorts, (cohort: Cohort<Message, Payload>) => {
        if (cohort.state !== 'waitingForCompletion') {
          return;
        }
        return this.completeMessage(txId, cohort.id, cohort.msg!, success);
      }));
    return this.updateTxState(txId, completedState);
  }

  private async getTxsCollection() {
    const client = await MongoClient.connect(
      `mongodb://${this.config.dbHost}:${this.config.dbPort}`);
    const db = client.db(this.config.dbName);
    if (this.config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${this.config.dbName}`);
    }
    const txs = db.collection('txs');
    txs.createIndex({ id: 1 }, { unique: true });
    txs.createIndex({ 'cohorts.id': 1 });
    return txs;
  }
}
