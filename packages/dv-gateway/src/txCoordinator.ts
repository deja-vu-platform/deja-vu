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
  sendAbortToClient: (msg: Message, state?: State) => void;
  // payload is what got returned in `sendVoteToCohort`
  sendToClient: (payload: Payload, state?: State) => void;
  onError: (error: Error, msg: Message, state?: State) => void;
  getCohorts: (cohortId: string) => string[];
}

export interface Vote<Payload> {
  result: 'yes' | 'no';
  payload: Payload;
}

type TxStatus = (
  'voting' | 'committing' | 'committed' | 'aborting' | 'aborted');

// cohorts can be in an additional state in which they voted and are now waiting
// for a resolution
type CohortStatus = TxStatus | 'waitingForCompletion';

interface Cohort<Message, Payload> {
  id: string;
  msg?: Message;
  vote?: Vote<Payload> | undefined;
  status?: CohortStatus;
}

interface TxDoc<Message, Payload> {
  id: string;
  status: TxStatus;
  // Could be undefined if we haven't processed message from the cohort yet
  cohorts: Cohort<Message, Payload>[];
  // When the tx was started
  startedOn: Date;
}

interface Transition {
  newTxStatus?: 'committing' | 'aborting';
  newCohortStatus?: 'waitingForCompletion';
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
    if (!_.includes(_.map(tx.cohorts, 'id'), cohortId)) {
      // We received a request from a cohort that is not part of the tx
      this.config.onError(
        new Error(`[txId: ${txId}] ${cohortId} is not part of this tx`),
        msg, state);
      return;
    }

    // If we got here the tx has been initialized (by this msg or a previous one)
    // The tx status could be 'voting', 'aborting' or 'aborted'

    // We might still end up sending an unnecessary vote message if the tx
    // changes to abort right after we do the check but that won't cause any
    // problems. The check here is mostly to save some unnecessary votes.
    if (this.shouldAbort(tx)) {
      this.config.sendAbortToClient(msg, state);
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
        'cohorts.$.status': 'voting'
      } });
    if (update.matchedCount == 0) { // Duplicate request
      this.config.onError(
        new Error(`[txId: ${txId}] Duplicate message from ${cohortId}`),
        msg, state);
    }
    const vote: Vote<Payload> = await this.config.sendVoteToCohort(msg);
    this.saveVote(txId, cohortId, vote);

    // We need to be sure that we are processing votes one by one because:
    // (i) as soon as one votes 'no' we are going to abort, and
    // (ii) when we receive the last 'yes' we are going to commit.
    const transition: Transition = await this.lock.acquire(txId, () => {
      return this.processVote(txId, cohortId, vote, () => {
          this.config.sendToClient(vote.payload);
      }, () => {
          this.config.sendAbortToClient(msg, state);
      });
    });

    let ret;
    if (_.isEmpty(transition)) {  // tx was already aborting
      this.config.sendAbortToClient(msg, state);
      this.completed.emit(txId + '-abort');
      ret = this.completeMessage(txId, cohortId, msg, false);
    } else if (transition.newTxStatus === 'committing' &&
               !transition.newCohortStatus) {
      this.config.sendToClient(vote.payload);
      this.completed.emit(txId + '-commit');
      ret = Promise.all([
        this.completeTx(txId, true),
        this.completeMessage(txId, cohortId, msg, true)]);
    } else if (!transition.newTxStatus &&
               transition.newCohortStatus === 'waitingForCompletion') {
      // nothing to do in this case since we are waiting
    } else if (transition.newTxStatus === 'aborting') {
      this.config.sendAbortToClient(msg);
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
        status: 'voting',
        currentDate: { startedOn: new Date() },
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
        await this.updateTxStatus(txId, 'committing');
        ret.newTxStatus = 'committing';
      } else { // we are not the last one
        // wait on complete
        this.completed.on(txId + '-commit', onCommit);
        this.completed.on(txId + '-abort', onAbort);
        await this.updateCohortStatus(txId, cohortId, 'waitingForCompletion');
        ret.newCohortStatus = 'waitingForCompletion';
      }
    } else { // the vote was 'no'
      // We know that all previous votes were 'yes' because if o/w the state
      // would be 'aborting'/'aborted'. Thus, we are in the 'voting' phase and
      // this is the first 'no' vote
      await Promise.all([
        this.updateCohortStatus(txId, cohortId, 'waitingForCompletion'),
        this.updateTxStatus(txId, 'aborting')]);
      ret.newTxStatus = 'aborting';
      ret.newCohortStatus = 'waitingForCompletion';
    }
    return ret;
  }

  private shouldAbort(tx: TxDoc<Message, Payload>) {
    return tx.status === 'aborting' || tx.status === 'aborted';
  }

  private allVotedButOne(tx: TxDoc<Message, Payload>): boolean {
    return _.chain(tx.cohorts)
      .map('status')
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

  private updateCohortStatus(
    txId: string, cohortId: string, newStatus: CohortStatus) {
    return this.txs!
      .updateOne(
        { id: txId, 'cohorts.id': cohortId },
        { $set: { [`cohorts.$.status`]: newStatus } });
  }

  private updateTxStatus(id: string, newStatus: CohortStatus) {
    return this.txs!.updateOne({ id: id }, { $set: { state: newStatus } });
  }

  /**
   *  Every time this function runs, it aborts active txs whose
   *  `startedOn + TX_TIMEOUT_SECONDS` time is less than the current time.
   **/
  private async timeoutAbort() {
    const threshold = new Date();
    threshold.setSeconds(threshold.getSeconds() - TX_TIMEOUT_SECONDS);
    const txsToAbort: {id: string}[] = await this.txs!.find<{id: string}>({
      status: 'voting',
      startedOn: { $gte: threshold }
    }, { projection: { id: 1 } }).toArray();

    await Promise.all(
      _.map(txsToAbort, async (txToAbort: TxDoc<Message, Payload>) => {
        return this.lock.acquire(txToAbort.id, async () => {
            const tx: TxDoc<Message, Payload> = (await this.txs!
              .findOne({ id: txToAbort.id }, { projection: { status: 1 }}))!;
            if (tx.status !== 'voting') {
              return false;
            }
            await this.updateTxStatus(txToAbort.id, 'aborting');
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
    const completedStatus = success ? 'committed' : 'aborted';
    const completingStatus = success ? 'committing' : 'aborting';
    const send = success ? this.config.sendCommitToCohort :
      this.config.sendAbortToCohort;
    return this.updateCohortStatus(txId, cohortId, completingStatus)
      // TODO: catch errors
      .then(unused => send(msg))
      .then(unused => this.updateCohortStatus(txId, cohortId, completedStatus));
  }

  private async completeTx(txId: string, success: boolean) {
    const completedStatus = success ? 'committed' : 'aborted';
    const tx: { cohorts: { id: string, msg?: Message }[] }= (await this.txs!
      .findOne({ id: txId }, {
        projection: { 'cohorts.msg': 1, 'cohorts.id': 1 }}))!;
    await Promise.all(
      _.map(
        tx.cohorts, (cohort: Cohort<Message, Payload>) => {
        if (cohort.status !== 'waitingForCompletion') {
          return;
        }
        return this.completeMessage(txId, cohort.id, cohort.msg!, success);
      }));
    return this.updateTxStatus(txId, completedStatus);
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
    txs.createIndex({ 'cohorts.id': 1 }, { unique: true });
    return txs;
  }
}
