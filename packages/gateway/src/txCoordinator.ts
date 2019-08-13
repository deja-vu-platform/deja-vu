import * as AsyncLock from 'async-lock';
import * as EventEmitter from 'events';
import { Collection, MongoClient } from 'mongodb';

import * as assert from 'assert';
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
  // `msg` is the original message processed
  // While the return value of these functions is ignored they should only
  // resolve to a value if the cohort responded to the commit/abort (only an
  // ACK is needed)
  sendCommitToCohort: (msg: Message) => Promise<void>;
  sendAbortToCohort: (msg: Message) => Promise<void>;
  sendVoteToCohort: (msg: Message) => Promise<Vote<Payload>>;

  /**
   * `causedAbort` is `true` if this is the client that caused the abort.
   * `payload` is `undefined` if the client never got to the point of voting.
   */
  sendAbortToClient: (
    causedAbort: boolean, msg?: Message, payload?: Payload,
    state?: State) => void;
  // `payload` is what got returned in `sendVoteToCohort`
  sendToClient: (payload: Payload, state?: State, index?: number) => void;

  onError: (error: Error, msg: Message, state?: State) => void;
}

export interface Vote<Payload> {
  result: 'yes' | 'no';
  payload: Payload;
}

type TxState = (
  'voting' | 'committing' | 'committed' | 'aborting' | 'aborted');

// Cohorts can be in an additional state in which they voted and are now waiting
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
const MS_IN_S = 1000;

function txMsg(msg: string, txId: string): string {
  return `[txId: ${txId}] ${msg}`;
}

function cohortMsg(msg: string, cohortId: string): string {
  return `(cohortId: ${cohortId}) ${msg}`;
}

function txCohortMsg(msg: string, txId: string, cohortId: string): string {
 return txMsg(cohortMsg(msg, cohortId), txId);
}

function log(msg: string, txId: string, cohortId?: string): void {
  const msgWithCohort = cohortId === undefined ? msg : cohortMsg(msg, cohortId);
  console.log(txMsg(msgWithCohort, txId));
}

/**
 *  Coordinates between a set of participants on whether to commit or abort
 *  a transaction.
 */
export class TxCoordinator<Message, Payload, State = any> {
  // The tx id are used as the keys for locking
  private lock = new AsyncLock();
  // Each tx emits a txId-[commit | abort] event
  private completed = new EventEmitter();
  private txs: Collection<TxDoc<Message, Payload>> | undefined;

  constructor(private config: TxConfig<Message, Payload, State>) {}

  async start() {
    this.txs = await this.getTxsCollection();
    setInterval(this.timeoutAbort.bind(this), TX_TIMEOUT_SECONDS * MS_IN_S);
  }

  async processMessage(txId: string, cohortId: string, cohorts: string[],
    msg: Message, state?: State, index?: number)
    : Promise<void> {
    return this.doProcessMessage(txId, cohortId, cohorts, msg, state, index)
      .catch((e) => {
        this.config.onError(e, msg, state);
      });
  }

  private async doProcessMessage(txId: string, cohortId: string,
    cohorts: string[], msg: Message, state?: State, index?: number)
    : Promise<void> {
    if (!this.txs) {
      throw new Error('TxCoordinator hasn\'t been started yet: call start()');
    }
    log(`Processing msg ${JSON.stringify(msg)}`, txId, cohortId);
    const tx: TxDoc<Message, Payload> = await this.getTx(txId, cohorts);

    // No race condition here because the set of cohorts doesn't change after
    // initialization
    // While we could deactivate this check we still need to know the expected
    // components that make up a transaction so that we know when it's done
    const cohortIds =  _.map(tx.cohorts, 'id');
    if (!_.includes(cohortIds, cohortId)) {
      // We received a request from a cohort that is not part of the tx
      throw new Error(txMsg(
        `${cohortId} is not part of this tx. Cohorts are ` +
        JSON.stringify(cohortIds),
        txId));
    }

    // If we got here the tx has been initialized (by this msg or a previous
    // one). The tx state could be 'voting', 'aborting' or 'aborted'

    // We might still end up sending an unnecessary vote message if the tx
    // changes to abort right after we do the check, but that won't cause any
    // problems. The check here is mostly to save some unnecessary votes.
    if (this.shouldAbort(tx)) {
      this.config.sendAbortToClient(false, msg, undefined, state);

      return;
    }

    // Tx state is 'voting'

    // Here we are using mongodb to essentially lock on `txId` and `cohortId`
    // to detect duplicate requests and if o/w send the vote (so that we never
    // send a duplicate vote to a cohort)
    // If `cohorts.msg` is defined then this is a duplicate req
    const update = await this.txs.updateOne(
      {
        id: txId,
        cohorts: {
          $elemMatch: { id: cohortId, msg: { $exists: false } }
        }
      },
      { $set: {
        'cohorts.$.msg': msg,
        'cohorts.$.vote': undefined,
        'cohorts.$.state': 'voting'
      } });
    if (update.matchedCount === 0) { // Duplicate request
      throw new Error(txMsg(`Duplicate message from ${cohortId}`, txId));
    }
    let vote: Vote<Payload>;
    try {
      log(`Sending vote to cohort`, txId, cohortId);
      vote = await this.config.sendVoteToCohort(msg);
    } catch (e) {
      // The cohort didn't vote yes/no but crashed or returned a wrong response
      throw new Error(txCohortMsg(
        `Sending vote to cohort failed: ${e}`, txId, cohortId));
    }
    log(`Received vote ${JSON.stringify(vote)}`, txId, cohortId);
    // We don't need to await this method because we don't care when the vote
    // gets saved---it is only saved for logging purposes.
    this.saveVote(txId, cohortId, vote);

    // We need to be sure that we are processing votes one by one because:
    // (i) as soon as one votes 'no' we are going to abort, and
    // (ii) when we receive the last 'yes' we are going to commit.
    const transition: Transition = await this.lock.acquire(txId, () => {
      return this.processVote(txId, cohortId, vote, () => {
        // onCommit callback
        log(
          'Not waiting anymore (tx committed). ' +
          `Send payload to client of cohort ${cohortId}`, txId);
        this.config.sendToClient(vote.payload, state, index);
      }, () => {
        // onAbort callback
        log(
          'Not waiting anymore (tx aborted). ' +
          `Send payload to client of cohort ${cohortId}`, txId);
        this.config.sendAbortToClient(false, msg, vote.payload, state);
      });
    });

    log(`Processing tx transition caused by cohort ${cohortId}`, txId);
    let ret;
    if (_.isEmpty(transition)) {  // Tx was already aborting
      log(`Tx aborted. Send abort to client of cohort ${cohortId}`, txId);
      this.config.sendAbortToClient(false, msg, vote.payload, state);
      ret = this.completeMessage(txId, cohortId, msg, false);
    } else if (transition.newTxState === 'committing' &&
               !transition.newCohortState) {
      log(`Tx committed. Send payload to client of cohort ${cohortId}`, txId);
      // While it is OK to send the messages back to the client at this point
      // (because we know that the tx will commit), it has the problem that
      // a client could quickly send another request that will get to the
      // concept server before the server commits. This has the unfortunate
      // effect that if the client e.g., creates a post and then tries to
      // load it immediately, it might say "post not found". To avoid this
      // glitch, we only send the messages back to the client after we
      // get confirmation that the concept server committed.
      // Thus, we don't do this now:
      // this.config.sendToClient(vote.payload, state, index);
      // this.completed.emit(txId + '-commit');
      // And we do it after `completeTx` and `completeMessage`:
      ret = Promise
        .all([
          this.completeTx(txId, true),
          this.completeMessage(txId, cohortId, msg, true)
        ])
        .then(() => {
          this.config.sendToClient(vote.payload, state, index);
          this.completed.emit(txId + '-commit');
        });
    } else if (!transition.newTxState &&
               transition.newCohortState === 'waitingForCompletion') {
      log(`Tx pending. Cohort ${cohortId} is waiting for completion`, txId);
      // Nothing to do in this case since we are waiting
    } else if (transition.newTxState === 'aborting') {
      log(`Tx is aborting. Send abort to client of cohort ${cohortId}`, txId);
      this.config.sendAbortToClient(true, msg, vote.payload, state);
      this.completed.emit(txId + '-abort');
      ret = Promise.all([
        this.completeTx(txId, false),
        this.completeMessage(txId, cohortId, msg, false)]);
    } else {
      throw new Error('Invalid transition');
    }

    return ret;
  }

  private async getTx(txId: string, cohorts: string[])
    : Promise<TxDoc<Message, Payload>> {
    const cohortObjects = _.map(cohorts, (id: string) => ({ id }));
    try { // https://jira.mongodb.org/browse/SERVER-14322
      // Look at the tx table and create one if there's no active tx for txId
      return (await this.txs!.findOneAndUpdate(
        { id: txId },
        { $setOnInsert: {
          state: 'voting',
          startedOn: new Date(),
          cohorts: cohortObjects
        } },
        { returnOriginal: false, upsert: true }))
        .value!;
    } catch (e) {
      log(`We got ${e}, this is not an error (it is expected to ` +
        'happen in some cases)', txId);

      // Definitely not null because the catch should only happen if we have two
      // concurrent threads trying to do the upsert at the same time. In that
      // case one succeeds but the other fails with a unique exception.
      return (await this.txs!.findOne({ id: txId }))!;
    }
  }

  // Updates the cohort and tx state and registers a complete listener according
  // to the vote result
  private async processVote(
    txId: string, cohortId: string, vote: Vote<Payload>,
    onCommit: () => void, onAbort: () => void): Promise<Transition> {
    // Txs are never removed and if we got here we know there's a tx doc
    const tx: TxDoc<Message, Payload> = (await this.txs!
      .findOne({ id: txId }))!;
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
      } else { // We are not the last one
        // Wait on complete
        this.completed.on(txId + '-commit', onCommit);
        this.completed.on(txId + '-abort', onAbort);
        await this.updateCohortState(txId, cohortId, 'waitingForCompletion');
        ret.newCohortState = 'waitingForCompletion';
      }
    } else { // The vote was 'no'
      if (vote.result !== 'no') {
        log(
          `Got a vote back that was not 'yes'/'no'. The concept ` +
          'doesn\'t correctly implement voting', txId, cohortId);
      }
      // We know that all previous votes were 'yes' because if o/w the state
      // would be 'aborting'/'aborted'. Thus, we are in the 'voting' phase and
      // this is the first 'no' vote
      await this.updateTxState(txId, 'aborting');
      ret.newTxState = 'aborting';
    }

    return ret;
  }

  private shouldAbort(tx: TxDoc<Message, Payload>) {
    return tx.state === 'aborting' || tx.state === 'aborted';
  }

  private allVotedButOne(tx: TxDoc<Message, Payload>): boolean {
    return _.chain(tx.cohorts)
      .map('state')
      .filter((s) => s === 'waitingForCompletion')
      .value()
      .length === tx.cohorts.length - 1;
  }

  private saveVote(txId: string, cohortId: string, vote: Vote<Payload>) {
    return this.txs!
      .updateOne(
        { id: txId, 'cohorts.id': cohortId },
        { $set: { [`cohorts.$.vote`]: vote } });
  }

  private async updateCohortState(
    txId: string, cohortId: string, newState: CohortState): Promise<void> {
    const update = await this.txs!
      .updateOne(
        { id: txId, 'cohorts.id': cohortId },
        { $set: { [`cohorts.$.state`]: newState } });
    if (update.modifiedCount === 0) {
      throw new Error(
        txCohortMsg(
          `Couldn't set state to ${newState} ` +
          `(matched: ${update.matchedCount})`, txId, cohortId));
    }
  }

  private updateTxState(id: string, newState: TxState) {
    return this.txs!.updateOne({ id: id }, { $set: { state: newState } });
  }

  /**
   *  Every time this function runs, it aborts active txs whose
   *  `startedOn + TX_TIMEOUT_SECONDS` time is less than the current time.
   */
  private async timeoutAbort() {
    const threshold = new Date();
    threshold.setSeconds(threshold.getSeconds() - TX_TIMEOUT_SECONDS);
    const txsToAbort: {id: string}[] = await this.txs!
      .find<{id: string}>(
        { state: 'voting', startedOn: { $lt: threshold } },
        { projection: { id: 1 } })
      .toArray();

    console.log(
      `Found ${txsToAbort.length} transactions to abort due to timeout`);
    await Promise.all(
      _.map(txsToAbort, async (txToAbort: TxDoc<Message, Payload>) => {
        return this.lock.acquire(txToAbort.id, async (): Promise<boolean> => {
            const tx: TxDoc<Message, Payload> = (await this.txs!
              .findOne({ id: txToAbort.id }, { projection: { state: 1 }}))!;
            if (tx.state !== 'voting') {
              return false;
            }
            log('Aborting due to timeout', txToAbort.id);
            await this.updateTxState(txToAbort.id, 'aborting');

            return true;
          })
          .then((shouldCompleteTx: boolean): Promise<any> | undefined => {
            if (shouldCompleteTx) {
              log('Emitting abort event', txToAbort.id);
              this.completed.emit(txToAbort.id + '-abort');

              return this.completeTx(txToAbort.id, false);
            }

            return undefined;
          });
      })
    );
  }

  /**
   * Send a complete ('commit' or 'abort') message to a cohort server.
   *
   * After an ACK is received, the cohort state is updated.
   *
   * Function returns after an ACK is received.
   */
  // Mutates the cohort state
  private async completeMessage(
    txId: string, cohortId: string, msg: Message, success: boolean)
    : Promise<void> {
    const completedState = success ? 'committed' : 'aborted';
    const completingState = success ? 'committing' : 'aborting';
    const send = success ? this.config.sendCommitToCohort :
      this.config.sendAbortToCohort;

    log(
      `Sending complete message to cohort, success: ${success}`,
      txId, cohortId);
    await this.updateCohortState(txId, cohortId, completingState);
    try {
      await send(msg);
    } catch (e) {
      // TODO: handle errors
      log(e, txId);
      throw new Error(txCohortMsg(
        `Sending commit/abort failed`, txId, cohortId));
    }
    await this.updateCohortState(txId, cohortId, completedState);
  }

  // Mutates the tx state and the cohort state if it's not waitingForCompletion
  private async completeTx(txId: string, success: boolean) {
    const completedState = success ? 'committed' : 'aborted';
    log(`Completing tx (status: ${completedState})`, txId);
    const tx: { cohorts: { id: string, msg?: Message }[] } = (await this.txs!
      .findOne({ id: txId }, {
        projection: {
          'cohorts.msg': 1, 'cohorts.id': 1, 'cohorts.state': 1
        }}))!;
    await Promise.all(
      _.map(
        tx.cohorts, (cohort: Cohort<Message, Payload>) => {
        if (cohort.state !== 'waitingForCompletion') {
          log(
            `cohort ${cohort.id} is not waiting for completion ` +
            `(it's ${cohort.state}), not sending complete message`, txId);

          return undefined;
        }

        log(`On complete tx, sending complete message to ${cohort.id} ` +
          `(state is: ${cohort.state})`, txId);

        assert.ok(
          !_.isNil(cohort.msg),
          txMsg(`Expected msg for ${cohort.id} but got undefined`, txId));

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
    await Promise.all([
      txs.createIndex({ id: 1 }, { unique: true }),
      txs.createIndex({ 'cohorts.id': 1 })
    ]);

    return txs;
  }
}
