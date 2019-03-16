import * as _ from 'lodash';
import * as mongodb from 'mongodb';

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
  private readonly _collection: mongodb.Collection<PendingDoc & T>;

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

        return true;
      case 'commit':
        await this._collection.deleteOne(this.getReqIdPendingFilter(context));
        break;
      case 'abort':
        await this.releaseLock(context);
        break;
    }

    return undefined;
  }

  async find(query?: Query<T>, options?: mongodb.FindOneOptions): Promise<T[]> {
    const queryNotPendingCreate: Query<PendingDoc & T> =
      this.getNotPendingCreateFilter(query);

    return await this._collection
      .find(queryNotPendingCreate, options)
      .toArray();
  }

  async findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T> {
    const queryNotPendingCreate: Query<PendingDoc & T> =
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
          this.getReqIdPendingFilter(context), unsetPendingOp);
        break;
      case 'abort':
        await this._collection.deleteMany(this.getReqIdPendingFilter(context));
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
          throw new ClicheDbDuplicateKeyError();
        }

        return doc;
      case 'commit':
        // release lock/remove pending fields
        // to indicate that the document is now actually created
        await this.releaseLock(context);
        break;
      case 'abort':
        await this._collection.deleteOne(this.getReqIdPendingFilter(context));
        break;
    }

    return doc;
  }

  // async updateMany(context: Context, filter: Query<T>, update: Object,
  //   options?: mongodb.CommonOptions & { upsert?: boolean }
  // ):Promise<boolean> {
  //   // TODO
  // }

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
        await this.releaseLock(context);

        return true;
      case 'commit':
        // apply the update and remove the pending lock at the same time
        await this._collection.updateOne(this.getReqIdPendingFilter(context),
          { ...update, ...unsetPendingOp } as Object);
        break;
      case 'abort':
        await this.releaseLock(context);
        break;
    }

    return undefined;
  }

  /**
   * Attempt to get the lock on the document given by the filter,
   * and throws the appropriate exception if it fails.
   * @param  filter the filter to get the desired document
   * @return the promise that will resolve when the method is done
   * @throws ClicheDbNotFoundError if the filter does not return any documents
   * @throws ClicheDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getPendingLock(filter: Query<T>): Promise<void> {
    // use the _pending field as the lock
    // if it is set to true, that means someone owns the lock to that doc
    const pendingUpdateObj = await this._collection.updateOne(
        filter,
        { $set: { _pending: true } });

    if (pendingUpdateObj.matchedCount === 0) {
      throw new ClicheDbNotFoundError(this._name);
    }
    // if nothing was modified, it means that _pending: true
    // was already previously set, meaning some other tx has the lock so we fail
    if (pendingUpdateObj.modifiedCount === 0) {
      throw new ClicheDbConcurrentUpdateError();
    }
  }

  private async releaseLock(context: Context): Promise<void> {
    await this._collection.updateOne(
      this.getReqIdPendingFilter(context), unsetPendingOp);
  }

  /**
   * Try to aquire the lock of a document for the given context.
   * If successful, the document will contain information from the context
   * that indicates that context owns the lock to the document.
   *
   * @param  context the context trying to acquire the lock
   * @param  filter  the filter to get the document to lock
   * @param  updateType whether the update is for an update or a delete
   * @throws ClicheDbNotFoundError if the filter does not return any documents
   * @throws ClicheDbConcurrentUpdateError if the lock is held by another tx
   */
  private async getLockForUpdate(context: Context, filter: Query<T>,
    updateType: 'update' | 'delete', upsert: boolean = false): Promise<void> {
    return await this.getLockAndUpdate(context, filter, updateType, { upsert });
  }

  /**
   * Try to aquire the lock of a document for the given context,
   * then apply the given update.
   * If successful, the document will be updated
   * and will also contain information from the context
   * that indicates that context owns the lock to the document.
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
    options?: mongodb.ReplaceOneOptions): Promise<void> {
    // Get the lock on the document first, then udpate the document
    // with the information from the context and the given update.
    // Separating these actions allows us to differentiate between
    // not found errors and concurrent update errors
    try {
      await this.getPendingLock(filter);
      const updateSetOp = {
        ...update['$set'], // make sure to include any $set ops from `update`
        _pendingDetails: {
          reqId: context.reqId,
          type: `${updateType}-${this._name}`
        }
      };
      const updateResult = await this._collection
        .updateOne(filter, {
          ...update,
          $set: updateSetOp
        } as Object, options);

      if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
        // Unknown because the update to get the lock
        // had just been successfully applied on the same object.
        // No other update should have gone through in between,
        // so there is no reason for this update to have failed
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

  /**
   * Get the query for obtaining all the documents
   * that the given context has the lock to
   */
  private getReqIdPendingFilter(context: Context): Query<PendingDoc & T> {
    return { '_pendingDetails.reqId': context.reqId };
  }

  private getNotPendingCreateFilter(
    filter: Query<T> | undefined): Query<PendingDoc & T> {
    return Object.assign({}, filter, {
      _pending: { $exists: false },
      '_pendingDetails.type': { $ne: `create-${this._name}` }
    });
  }

  /**
   * Set the appropriate "pending" fields of the given document
   * to indicate that it is still pending creation,
   * i.e. it is not actually part of the collection yet,
   * and that the given context owns the lock to the document.
   * @param context the context trying to creating the document
   * @param doc the document to create and on which to set pending fields
   */
  private setPendingCreate(context: Context, doc: PendingDoc & T): void {
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
