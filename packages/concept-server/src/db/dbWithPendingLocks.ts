import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  ConceptDbConcurrentUpdateError,
  ConceptDbDuplicateKeyError,
  ConceptDbNotFoundError,
  ConceptDbUnknownUpdateError,
  Collection,
  Context,
  Query,
  UpsertOptions
} from './db';
import {
  getReqIdPendingFilter,
  releaseLockOp,
  UpdateOp
} from './updateOp';

export interface PendingDoc {
  _pending?: boolean;
  _pendingDetails?: {
    reqId: string;
    type: string;
  };
}

export const unsetPendingOp: Object = { $unset:
  {
    _pending: '',
    _pendingDetails: ''
  }
};

export type DbDoc<T> = PendingDoc & T;

// https://docs.mongodb.com/manual/core/index-unique/
const MONGODB_DUPLICATE_KEY_ERROR_CODE = 11000;

/**
 * An implementation of Déjà Vu's Collection,
 * a wrapper around the MongoDb Node.js driver for transaction handling.
 *
 * This uses a `_pending` boolean field as a lock for each document,
 * and stores the request ID and type (e.g. create-foo, update-foo) under
 * the `_pendingDetails` field of the document.
 *
 * More specifically,
 * - Before creating/updating/deleting a document, acquire the lock
 *   to that document, i.e. set `_pending: true`
 * - If the modified count is 0, another tx has the lock, so throw a concurrent
 *   update error.
 *   Else, locking was a success so the scheme sets the `_pendingDetails` field
 *   and applies any relevant updates, depending on which phase of 2PC it is.
 *   Create operations specify that a document is pending create under
 *   `_pendingDetails` which find operations will take care not to return.
 *   Updates only happen on commit so find operations will only return the
 *   current version of docs, without the pending update.
 * - Release the lock, i.e. unset `_pending` and `_pendingDetails`, when the tx
 *   is over (on abort and at the end of the commit) or at the end of a non-tx
 *   operation, if needed (see below).
 * - Non-tx updates still need to follow the locking scheme so that it can throw
 *   a not found error, or a concurrent update error since you can't perform an
 *   update on a document which has another update in progress/is locked by a tx
 *
 * The locking scheme above ensures that once a tx successfully locks on a doc,
 * no other tx or non-tx operation can modify it. Those concurrent operations
 * will fail with a concurrent update error. Reads will still be able to read
 * the unupdated value.
 *
 * The only constraint that can be enforced atomically for inserts
 * are the uniqueness constraints set by the created indices.
 * Concepts would have to check other preconditions separately,
 * without the guarantee that those conditions would not have changed
 * by the time the insert happens. If the concept does not allow certain fields
 * to be mutated, then preconditions that rely on those field values could be
 * checked outside of a transaction. Alternatively, concepts could handle
 * transactions by themselves and not rely on this library. They could also
 * perform operations that involve multiple documents or multiple Collection<T>s
 * in a transaction by using ConceptDb.inTransaction()
 */
export class CollectionWithPendingLocks<T> implements Collection<T> {
  private readonly _db: mongodb.Db;
  private readonly _name: string;
  private readonly _collection: mongodb.Collection<DbDoc<T>>;

  constructor(db: mongodb.Db, name: string) {
    this._db = db;
    this._name = name;
    this._collection = this._db.collection(this._name);
    this._collection
      .createIndex({ '_pendingDetails.reqId': 1 }, { sparse: true });
  }

  aggregate(pipeline: Object[], options?: mongodb.CollectionAggregationOptions):
    mongodb.AggregationCursor<T> {
    const isFirstStageAQuery = pipeline.length > 0 && pipeline[0]['$match'];
    const originalQuery = isFirstStageAQuery ? pipeline[0]['$match'] : {}
    const queryNotPendingCreate: Query<DbDoc<T>> =
      this.getNotPendingCreateFilter(originalQuery);

    let newPipeline;
    if (isFirstStageAQuery) {
      pipeline[0]['$match'] = queryNotPendingCreate;
      newPipeline = pipeline;
    } else {
      const newFirstStage: Object = { $match: queryNotPendingCreate };
      newPipeline = [newFirstStage].concat(pipeline);
    }

    return this._collection.aggregate(newPipeline, options);
  }

  async createIndex(fieldOrSpec: string | any,
    options?: mongodb.IndexOptions): Promise<string> {
    return this._collection.createIndex(fieldOrSpec, options);
  }

  async countDocuments(query: Query<T> = {},
    options?: mongodb.MongoCountPreferences): Promise<number>{
    const queryNotPendingCreate = this.getNotPendingCreateFilter(query);

    return this._collection.countDocuments(queryNotPendingCreate, options);
  }

  async deleteMany(context: Context, filter: Query<T>,
    options?: mongodb.CommonOptions): Promise<boolean> {
    switch (context.reqType) {
      case 'vote':
        // make sure we can update and no one else touches it before we commit
        await this.getLockForUpdate(context, filter, 'delete',
          { upsert: false }, true);

        return true;
      case undefined:
        // try to lock on it first to throw
        // either not found or concurrent update error if needed
        await this.getLockForUpdate(context, filter, 'delete',
          { upsert: false }, true);
        const res = await this._collection.deleteMany(filter, options);

        if (res.deletedCount === 0) {
          await this.releaseLock(context, filter, true);
          // unknown because the delete shouldn't fail if the lock succeeded
          throw new ConceptDbUnknownUpdateError();
        }

        return true;
      case 'commit':
        await this._collection.deleteMany(
          getReqIdPendingFilter(context, filter));
        break;
      case 'abort':
        await this.releaseLock(context, filter, true);
        break;
    }

    return undefined;
  }

  async deleteOne(context: Context, filter: Query<T>): Promise<boolean> {
    switch (context.reqType) {
      case 'vote':
        // make sure doc exists and that no one else touches it before we commit
        await this.getLockForUpdate(context, filter, 'delete');

        return true;
      case undefined:
        // try to lock on it first to throw
        // either not found or concurrent update error if needed
        await this.getLockForUpdate(context, filter, 'delete');
        const res = await this._collection.deleteOne(filter);

        if (res.deletedCount === 0) {
          await this.releaseLock(context, filter);
          // unknown because the delete shouldn't fail if the lock succeeded
          throw new ConceptDbUnknownUpdateError();
        }

        return true;
      case 'commit':
        await this._collection.deleteOne(
          getReqIdPendingFilter(context, filter));
        break;
      case 'abort':
        await this.releaseLock(context, filter);
        break;
    }

    return undefined;
  }

  async find(query?: Query<T>): Promise<T[]> {
    return (await this.findCursor(query)).toArray();
  }

  async findCursor(query?: Query<T>): Promise<mongodb.Cursor<T>> {
    const queryNotPendingCreate: Query<DbDoc<T>> =
      this.getNotPendingCreateFilter(query);

    return await this._collection.find(queryNotPendingCreate);
  }

  async findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T> {
    const queryNotPendingCreate: Query<DbDoc<T>> =
      this.getNotPendingCreateFilter(query);

    const doc: T | null = await this._collection.findOne(
      queryNotPendingCreate, options);
    if (doc === null) {
      throw new ConceptDbNotFoundError(this._name);
    }

    return doc;
  }

  async findOneAndUpdateWithFn(
    context: Context, filter: Query<T>,
    updateFn: (doc: T) => Object | undefined,
    options?: mongodb.ReplaceOneOptions & UpsertOptions,
    validationFn?: (doc: T | null) => any): Promise<T | undefined> {

    switch (context.reqType) {
      case 'vote':
        /* falls through */
      case undefined: {
        const setOnInsertVal = options && options.setOnInsert;
        const getLockUpdateObj = setOnInsertVal ?
          { $setOnInsert: setOnInsertVal } : {};
        // make sure doc exists and lock on it before we apply update
        await this.getLockAndUpdate(
          context, filter, 'update', getLockUpdateObj, options);
        // we can fetch the doc safely because we know we have the lock
        const doc: T = await this._collection.findOne(filter);
        try {
          validationFn(doc);
        } catch (err) {
          await this.abortUpdate(context, filter);
          throw err;
        }
        if (context.reqType === undefined) {
          const update = updateFn(doc);
          if (!update) {
            await this._collection.deleteOne(filter);
          } else {
            await this._collection.updateOne(filter, update, options);
            await this.releaseLock(context, filter);
          }
        }

        return doc;
      }
      case 'commit':
        // we can fetch the doc safely because we know we have the lock
        const doc: T = await this._collection.findOne(filter);
        const update = updateFn(doc);
        if (!update) {
          await this._collection.deleteOne(
            getReqIdPendingFilter(context, filter));
          break;
        }
        // apply the update and remove the pending lock at the same time
        await this._collection.updateOne(
          getReqIdPendingFilter(context, filter),
          { ...updateFn(doc), ...unsetPendingOp } as Object);
        break;
      case 'abort':
        await this.abortUpdate(context, filter);
        break;
    }

    return undefined;
  }

  async insertMany(context: Context, docs: T[],
    options?: mongodb.CollectionInsertManyOptions): Promise<T[]> {
    switch (context.reqType) {
      case 'vote':
        // indicate that the documents we're about to insert are still pending
        _.each(docs, (doc) => this.setPendingCreate(context, doc));
        /* falls through */
      case undefined:
        // TODO: handle errors when some doc ids violate uniqueness constraints
        // should all not get inserted, or should the valid ones get inserted?
        await this._collection.insertMany(docs, options);

        return docs;
      case 'commit':
        // release lock/remove pending fields
        // to indicate that the documents are now actually created
        await this._collection.updateMany(
          getReqIdPendingFilter(context), unsetPendingOp);
        break;
      case 'abort':
        await this._collection.deleteMany(getReqIdPendingFilter(context));
        break;
    }

    return docs;
  }

  async insertOne(context: Context, doc: T,
    options?: mongodb.CollectionInsertOneOptions): Promise<T> {
    switch (context.reqType) {
      case 'vote':
        // indicate that the document we're about to insert is still pending
        this.setPendingCreate(context, doc);
        /* falls through */
      case undefined:
        try {
          const insertResult: mongodb.InsertOneWriteOpResult =
            await this._collection.insertOne(doc, options);

          if (insertResult.insertedCount === 0) {
            throw new ConceptDbUnknownUpdateError();
          }
        } catch (err) {
          if (err.code === MONGODB_DUPLICATE_KEY_ERROR_CODE) {
            // TODO: it's possible that the duplicate is still pending create
            throw new ConceptDbDuplicateKeyError();
          }
          throw err;
        }

        return doc;
      case 'commit':
        // release lock/remove pending fields
        // to indicate that the document is now actually created
        // cannot use the doc's id as filter here and in abort
        // because it could be different from the unique id
        // generated for the vote phase
        await this.releaseLock(context, {});
        break;
      case 'abort':
        await this._collection.deleteOne(getReqIdPendingFilter(context, {}));
        break;
    }

    return doc;
  }

  async updateMany(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.UpdateManyOptions): Promise<boolean> {
    switch (context.reqType) {
      case 'vote':
        // make sure we can update and no one else touches it before we commit
        await this.getLockForUpdate(context, filter, 'update',
          this.getUpsertOptions(update, options), true);

        return true;
      case undefined:
        // using the locking method below allows us to throw the right error–
        // not found or concurrent update error
        await this.getLockAndUpdate(
          context, filter, 'update', update, options, true);
        await this.releaseLock(context, filter, true);

        return true;
      case 'commit':
        // apply the update and remove the pending lock at the same time
        await this._collection.updateMany(
          getReqIdPendingFilter(context, filter),
          { ...update, ...unsetPendingOp } as Object);
        break;
      case 'abort':
        await this.abortUpdate(context, filter, true);
        break;
    }

    return undefined;
  }

  async updateOne(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.ReplaceOneOptions): Promise<boolean> {

    switch (context.reqType) {
      case 'vote':
        // make sure doc exists and that no one else touches it before we commit
        await this.getLockForUpdate(context, filter, 'update',
          this.getUpsertOptions(update, options));

        return true;
      case undefined:
        // using the locking method below allows us to throw the right error–
        // not found or concurrent update error
        await this.getLockAndUpdate(context, filter, 'update', update, options);
        await this.releaseLock(context, filter);

        return true;
      case 'commit':
        // apply the update and remove the pending lock at the same time
        await this._collection.updateOne(
          getReqIdPendingFilter(context, filter),
          { ...update, ...unsetPendingOp } as Object);
        break;
      case 'abort':
        await this.abortUpdate(context, filter);
        break;
    }

    return undefined;
  }

  /**
   * Attempt to get the lock on the document given by the filter,
   * and throws the appropriate exception if it fails.
   *
   * Note: This is not reentrant yet.
   *
   * @param  context the context trying to acquire the lock
   * @param  filter  the filter to get the desired document
   * @param  upsert  whether or not the update should do an upsert
   * @param  updateMany whether or not to apply the update to many documents
   * @return the promise that will resolve to whether or not there was an upsert
   * @throws ConceptDbNotFoundError if the filter does not return any documents
   * @throws ConceptDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getPendingLock(context: Context, filter: Query<T>,
    upsert: boolean, setOnInsert: Object,
    updateMany: boolean): Promise<boolean> {
    // use the _pending field as the lock
    // if it is set to true, that means someone owns the lock to that doc
    const setPendingRes = await this._update(
    {
      filter,
      update: {
        $set: { _pending: true },
        $setOnInsert: {
          ...setOnInsert,
          ...this.getPendingCreateFilter(context)
          // make sure we mark as pending create if we do an upsert
        }
      },
      upsert
    }, updateMany);

    if (setPendingRes.upsertedId) {
      return true;
    }

    if (setPendingRes.matchedCount === 0) {
      throw new ConceptDbNotFoundError(this._name);
    }
    // if not all matches were modified, it means that _pending: true
    // was already previously set on at least one of the intended documents,
    // meaning some other tx has the lock/s so we fail
    if (setPendingRes.matchedCount !== setPendingRes.modifiedCount) {
      if (setPendingRes.modifiedCount !== 0) {
        // release lock for the documents included in modifiedCount
        const unsetPendingRes = await this._update({
          filter: Object.assign({}, filter,
            { _pending: true, _pendingDetails: { $exists: false } }),
          update: unsetPendingOp
        });

        if (unsetPendingRes.modifiedCount !== setPendingRes.modifiedCount) {
          // TODO: it's possible that other txs in progress could match
          // the filter, and the update would remove the lock they've just
          // acquired. We need to figure out what to do in this case.
        }
      }
      throw new ConceptDbConcurrentUpdateError();
    }

    return false;
  }

  private async releaseLock(context: Context, filter: Query<T>,
    updateMany: boolean = false): Promise<void> {
    await this._update(releaseLockOp(context, filter), updateMany);
  }

  // TODO: pass in more update options if needed
  private async _update(op: UpdateOp<T>, updateMany: boolean = false):
  Promise<mongodb.UpdateWriteOpResult> {
    // cannot do this because it causes a TypeError
    // (probably because mongodb's updateMany and updateOne fns are overloaded)
    // const updateFn = updateMany ?
    //     this._collection.updateMany : this._collection.updateOne;
    if (updateMany) {
      return await this._collection.updateMany(
        op.filter, op.update, { upsert: op.upsert });
    }

    return await this._collection.updateOne(
      op.filter, op.update, { upsert: op.upsert });
  }

  /**
   * Try to aquire the lock of a document for the given context.
   * If successful, the document will contain information from the context
   * that indicates that context owns the lock to the document.
   *
   * Note: This is not reentrant yet.
   *
   * @param  context the context trying to acquire the lock
   * @param  filter  the filter to get the document to lock
   * @param  updateType whether the update is for an update or a delete
   * @param  upsertOptions  the upsert options
   * @param  updateMany whether or not to apply the update to many documents
   * @throws ConceptDbNotFoundError if the filter does not return any documents
   * @throws ConceptDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getLockForUpdate(context: Context, filter: Query<T>,
    updateType: 'update' | 'delete',
    upsertOptions: UpsertOptions = { upsert: false },
    updateMany: boolean = false): Promise<void> {
    return await this.getLockAndUpdate(context, filter, updateType,
      upsertOptions.setOnInsert ? { $setOnInsert: upsertOptions.setOnInsert } : {},
      { upsert: upsertOptions.upsert }, updateMany);
  }

  /**
   * Try to aquire the lock of a document for the given context,
   * then apply the given update.
   * If successful, the document will be updated
   * and will also contain information from the context
   * that indicates that context owns the lock to the document.
   *
   * Note: This is not reentrant yet.
   *
   * @param  context the context trying to acquire the lock
   * @param  filter  the filter to get the document to lock
   * @param  updateType whether the update is for an update or a delete
   * @param  update  the update to apply to the locked document
   * @param  options update op options
   * @param  updateMany whether or not to apply the update to many documents
   * @throws ConceptDbNotFoundError if the filter does not return any documents
   * @throws ConceptDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getLockAndUpdate(context: Context, filter: Query<T>,
    updateType: 'update' | 'delete', update: Object = {},
    options?: mongodb.ReplaceOneOptions,
    updateMany: boolean = false): Promise<void> {
    // Get the lock on the document first, then update the document
    // with the information from the context and the given update.
    // Separating these actions allows us to differentiate between
    // not found errors and concurrent update errors
    const didUpsert = await this.getPendingLock(context, filter,
      options && options.upsert, _.get(update, '$setOnInsert', {}), updateMany);

    // if there was an upsert:
    // no need to update anything if setOnInsert is the only update
    if (didUpsert && update['$setOnInsert'] &&
      Object.keys(update).length === 1) {
      return;
    }

    // if there was an upsert:
    // no need to set _pendingDetails because it should have already been set
    const updateSetOp = didUpsert ? {} : { $set: {
      ...update['$set'], // make sure to include any $set ops from `update`
      _pendingDetails: {
        reqId: context.reqId,
        type: `${updateType}-${this._name}`
      }
    }};

    // if there's nothing to update, then return
    if (_.isEmpty(updateSetOp) && _.isEmpty(update)) { return; }

    const updateResult = await this._update({
      filter,
      update: {
        ...update,
        ...updateSetOp
      } as Object
    }, updateMany);

    if (updateResult.matchedCount === 0 ||
      (updateResult.matchedCount !== updateResult.modifiedCount)) {
      // Unknown because the update to get the lock
      // had just been successfully applied on the same object.
      // No other update should have gone through in between,
      // so there is no reason for this update to have failed in most cases.
      // It could fail if this was an updateMany and a new document that
      // matched the filter was recently inserted and is pending
      throw new ConceptDbUnknownUpdateError();
    }
  }

  private getNotPendingCreateFilter(
    filter: Query<T> | undefined): Query<DbDoc<T>> {
    return Object.assign({}, filter, {
      '_pendingDetails.type': { $ne: `create-${this._name}` }
    });
  }

  private getPendingCreateFilter(
    context: Context, filter: Query<T> = {}): Object {
    return Object.assign(
      {}, filter, { _pendingDetails: {
        reqId: context.reqId,
        type: `create-${this._name}`
      }});
  }

  /**
   * Set the appropriate "pending" fields of the given document
   * to indicate that it is still pending creation,
   * i.e. it is not actually part of the collection yet,
   * and that the given context owns the lock to the document.
   * @param context the context trying to creating the document
   * @param doc     the document to create and on which to set pending fields
   */
  private setPendingCreate(context: Context, doc: DbDoc<T>): void {
    doc._pending = true;
    doc._pendingDetails = {
      reqId: context.reqId,
      type: `create-${this._name}`
    };
  }

  private async abortUpdate(context: Context, filter: Query<T>,
    updateMany: boolean = false): Promise<void> {
    // delete in case of upsert; remove lock if no upsert
    // we only need to deleteOne even for updateMany=true
    // because only <= 1 document is upserted in all cases
    const deleteResult =
      await this._collection.deleteOne(
        this.getPendingCreateFilter(context, filter));
    if (deleteResult.deletedCount === 0) {
      await this.releaseLock(context, filter, updateMany);
    }
  }

  private getUpsertOptions(update: Object,
    options: mongodb.ReplaceOneOptions |
      mongodb.UpdateManyOptions | undefined) {
    return {
      upsert: options && options.upsert,
      setOnInsert: update['$setOnInsert']
    };
  }
}
