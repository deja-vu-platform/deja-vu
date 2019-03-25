import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  /*addPendingDetailsOp, getPendingLockOp,*/
  getReqIdPendingFilter,
  releaseLockOp,
  UpdateOp
} from './db/updateOp';

export type Query<T> = mongodb.FilterQuery<T>;

export interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined; // undefined if not a tx
  runId: string;
  reqId: string;
}

/**
 * The empty Context to use when it isn't applicable,
 * e.g. when populating a Collection with initial objects on initialization.
 */
export const EMPTY_CONTEXT: Context = {
  reqType: undefined, runId: '', reqId: ''
};

export class ClicheDbError extends Error {
  public readonly errorCode: number;

  constructor(message: string, errorCode: number) {
    super(message);
    // tslint:disable-next-line
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.errorCode = errorCode;
  }
}
export class ClicheDbNotFoundError extends ClicheDbError {
  public static readonly ERROR_CODE = 404;
  constructor(collectionName: string) {
    // remove the 's', assumes collectionName ends with one
    const entityName = collectionName.substr(0, collectionName.length - 1);
    super(`${_.capitalize(entityName)} not found`,
      ClicheDbNotFoundError.ERROR_CODE);
  }
}
export class ClicheDbConcurrentUpdateError extends ClicheDbError {
  public static readonly ERROR_CODE = 500;
  constructor() {
    super('An error has occurred. Please try again later.',
      ClicheDbConcurrentUpdateError.ERROR_CODE);
  }
}
export class ClicheDbUnknownUpdateError extends ClicheDbError {
  public static readonly ERROR_CODE = 500;
  constructor() {
    super('An unknown error has occurred. Please contact an administrator.',
      ClicheDbUnknownUpdateError.ERROR_CODE);
  }
}
export class ClicheDbDuplicateKeyError extends ClicheDbError {
  public static readonly ERROR_CODE = 400;
  constructor() {
    super('Write violates the collection\'s uniqueness constraints',
      ClicheDbDuplicateKeyError.ERROR_CODE);
  }
}

export interface PendingDoc {
  _pending?: boolean;
  _pendingDetails?: {
    reqId: string;
    type: string;
  };
}

const unsetPendingOp: Object = { $unset:
  {
    _pending: '',
    _pendingDetails: ''
  }
};

export type DbDoc<T> = PendingDoc & T;

/**
 * Wrapper around the MongoDb Node.js driver
 * to add support for Déjà Vu's transaction handling,
 * exposing only the relevant methods for DV cliché servers.
 *
 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html
 */
export class Collection<T extends Object> {
  private readonly _db: mongodb.Db;
  private readonly _name: string;
  private readonly _collection: mongodb.Collection<DbDoc<T>>;

  constructor(db: mongodb.Db, name: string) {
    this._db = db;
    this._name = name;
    this._collection = this._db.collection(this._name);
  }

  aggregate(pipeline: Object[], options?: mongodb.CollectionAggregationOptions):
    mongodb.AggregationCursor<T> {
    // TODO
    return this._collection.aggregate(pipeline, options);
  }

  async createIndex(fieldOrSpec: string | any,
    options?: mongodb.IndexOptions): Promise<string> {
    return this._collection.createIndex(fieldOrSpec, options);
  }

  // async deleteMany(context: Context, filter: Query<T>,
  //   options?: mongodb.CommonOptions): Promise<boolean> {
  //   // TODO
  // }

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
          // unknown because the delete shouldn't fail if the lock succeeded
          throw new ClicheDbUnknownUpdateError();
        }
        await this.releaseLock(context, filter);

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

  async find(query?: Query<T>, options?: mongodb.FindOneOptions): Promise<T[]> {
    const queryNotPendingCreate: Query<DbDoc<T>> =
      this.getNotPendingCreateFilter(query);

    return await this._collection
      .find(queryNotPendingCreate, options)
      .toArray();
  }

  async findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T> {
    const queryNotPendingCreate: Query<DbDoc<T>> =
      this.getNotPendingCreateFilter(query);

    const doc: T | null = await this._collection.findOne(
      queryNotPendingCreate, options);
    if (doc === null) {
      throw new ClicheDbNotFoundError(this._name);
    }

    return doc;
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
        const insertResult: mongodb.InsertOneWriteOpResult =
          await this._collection.insertOne(doc, options);

        if (insertResult.insertedCount === 0) {
          // TODO: if the insert fails does it necessarily mean
          // it was a duplicate key error?
          // it could be that there's another that's pending create,
          // so the error then should be a concurrent update error instead
          throw new ClicheDbDuplicateKeyError();
        }

        return doc;
      case 'commit':
        // release lock/remove pending fields
        // to indicate that the document is now actually created
        await this.releaseLock(context, doc);
        break;
      case 'abort':
        await this._collection.deleteOne(getReqIdPendingFilter(context, doc));
        break;
    }

    return doc;
  }

  async updateMany(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.CommonOptions & { upsert?: boolean }): Promise<boolean> {
    switch (context.reqType) {
      case 'vote':
        // make we can update and that no one else touches it before we commit
        await this.getLockForUpdate(context, filter, 'update',
          options && options.upsert, true);

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
        // delete in case of upsert; remove lock(s) if no upsert
        const deleteResult =
          await this._collection.deleteOne(
            this.getPendingCreateFilter(context,filter));
        if (deleteResult.deletedCount === 0) {
          await this.releaseLock(context, filter, true);
        }
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
          options && options.upsert);

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
        // delete in case of upsert; remove lock if no upsert
        const deleteResult =
          await this._collection.deleteOne(
            this.getPendingCreateFilter(context, filter));
        if (deleteResult.deletedCount === 0) {
          await this.releaseLock(context, filter);
        }
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
   * @param  filter the filter to get the desired document
   * @return the promise that will resolve when the method is done
   * @throws ClicheDbNotFoundError if the filter does not return any documents
   * @throws ClicheDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getPendingLock(
    filter: Query<T>, updateMany: boolean): Promise<void> {
    // use the _pending field as the lock
    // if it is set to true, that means someone owns the lock to that doc
    const pendingUpdateObj = await this._update(
        { filter, update: { $set: { _pending: true } } }, updateMany);

    if (pendingUpdateObj.matchedCount === 0) {
      throw new ClicheDbNotFoundError(this._name);
    }
    // if not all matches were modified, it means that _pending: true
    // was already previously set on at least one of the intended documents,
    // meaning some other tx has the lock/s so we fail
    if (pendingUpdateObj.matchedCount !== pendingUpdateObj.modifiedCount) {
      if (pendingUpdateObj.modifiedCount !== 0) {
        // TODO: release lock for the documents included in modifiedCount
        // BUT we can't just unlock all documents that match filter +
        // { _pendingDetails: { $exists: false } } because what if
        // other txs that are supposed to be successful haven't put
        // their pendingDetails yet?
      }
      throw new ClicheDbConcurrentUpdateError();
    }
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
      return this._collection.updateMany(
        op.filter, op.update, { upsert: op.upsert });
    }

    return this._collection.updateOne(
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
   * @throws ClicheDbNotFoundError if the filter does not return any documents
   * @throws ClicheDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getLockForUpdate(context: Context, filter: Query<T>,
    updateType: 'update' | 'delete', upsert: boolean = false,
    updateMany: boolean = false): Promise<void> {
    return await this.getLockAndUpdate(context, filter, updateType, updateMany,
      { upsert });
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
   * @throws ClicheDbNotFoundError if the filter does not return any documents
   * @throws ClicheDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getLockAndUpdate(context: Context, filter: Query<T>,
    updateType: 'update' | 'delete', update: Object = {},
    options?: mongodb.ReplaceOneOptions,
    updateMany: boolean = false): Promise<void> {
    // Get the lock on the document first, then udpate the document
    // with the information from the context and the given update.
    // Separating these actions allows us to differentiate between
    // not found errors and concurrent update errors
    try {
      await this.getPendingLock(filter, updateMany);
      const updateSetOp = {
        ...update['$set'], // make sure to include any $set ops from `update`
        _pendingDetails: {
          reqId: context.reqId,
          type: `${updateType}-${this._name}`
        }
      };
      // upsert shouldn't be an option here anymore
      // because that's handled by getPendingLock and the catch block
      const updateResult = await this._update({
        filter,
        update: {
          ...update,
          $set: updateSetOp
        } as Object
      }, updateMany);

      if (updateResult.matchedCount === 0 ||
        (updateResult.matchedCount !== updateResult.modifiedCount)) {
        // Unknown because the update to get the lock
        // had just been successfully applied on the same object.
        // No other update should have gone through in between,
        // so there is no reason for this update to have failed in most cases.
        // It could fail if this was an updateMany and a new document that
        // match the filter was recently inserted and is pending
        throw new ClicheDbUnknownUpdateError();
      }
    } catch (err) {
      if (options && options.upsert &&
        err.errorCode === ClicheDbNotFoundError.ERROR_CODE) {
        await this.insertOne(
          context, Object.assign({}, filter, update['$set']), options);

        return;
      }
      throw err;
    }
  }

  private getNotPendingCreateFilter(
    filter: Query<T> | undefined): Query<DbDoc<T>> {
    return Object.assign({}, filter, {
      _pending: { $exists: false },
      '_pendingDetails.type': { $ne: `create-${this._name}` }
    });
  }

  private getPendingCreateFilter(context: Context, filter: Query<T>) {
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
   * @param doc the document to create and on which to set pending fields
   */
  private setPendingCreate(context: Context, doc: DbDoc<T>): void {
    doc._pending = true;
    doc._pendingDetails = {
      reqId: context.reqId,
      type: `create-${this._name}`
    };
  }
}

export class ClicheDb {
  private readonly _db: mongodb.Db;
  private readonly _collections: Map<string, Collection<any>> =
    new Map<string, Collection<any>>();

  constructor(db: mongodb.Db) {
    this._db = db;
  }

  /**
   * Get the collection with the given name from the database.
   */
  collection(name: string): Collection<any> {
    if (!this._collections.has(name)) {
      this._collections.set(name, new Collection(this._db, name));
    }

    return this._collections.get(name);
  }
}
