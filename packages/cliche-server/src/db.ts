import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export type Query<T> = mongodb.FilterQuery<T>;

export interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
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

const unsetPendingOp = { $unset:
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
  private readonly _collection: mongodb.Collection<T>;

  constructor(db: mongodb.Db, name: string) {
    this._db = db;
    this._name = name;
    this._collection = this._db.collection(this._name);
  }

  aggregate(pipeline, options): mongodb.AggregationCursor<T> {
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
        await this.getLockAndUpdate(filter, {
          $set: {
            _pendingDetails: {
              reqId: context.reqId,
              type: `delete-${this._name}`
            }
          }
        });

        return true;
      case undefined:
        const res = await this._collection.deleteOne(
          this.getNotPendingFilter(filter));

        if (res.deletedCount === 0) {
          throw new ClicheDbConcurrentUpdateError();
        }

        return true;
      case 'commit':
        await this._collection.deleteOne(this.getReqIdPendingFilter(context));
        break;
      case 'abort':
        await this.releasePendingLock(context);
        break;
    }

    return undefined;
  }

  async find(query?: Query<T>, options?: mongodb.FindOneOptions): Promise<T[]> {
    const queryNotPendingCreate: Query<T> =
      this.getNotPendingCreateFilter(query);

    return await this._collection
      .find(queryNotPendingCreate, options)
      .toArray();
  }

  async findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T> {
    const queryNotPendingCreate: Query<T> =
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
        _.each(docs, (doc) => this.makePendingCreate(context, doc));
        /* falls through */
      case undefined:
        await this._collection.insertMany(docs, options);

        return docs;
      case 'commit': {
        await this._collection.updateMany(
          this.getReqIdPendingFilter(context), unsetPendingOp);
      }
      case 'abort': {
        await this._collection.deleteMany(this.getReqIdPendingFilter(context));
      }
    }

    return docs;
  }

  async insertOne(context: Context, doc: T,
    options?: mongodb.CollectionInsertOneOptions): Promise<T> {
    switch (context.reqType) {
      case 'vote':
        this.makePendingCreate(context, doc);
      /* falls through */
      case undefined:
        await this._collection.insertOne(doc, options);

        return doc;
      case 'commit':
        await this.releasePendingLock(context);
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
        await this.getLockAndUpdate(filter, {
          $set: {
            _pendingDetails: {
              reqId: context.reqId,
              type: `update-${this._name}`
            }
          }
        });

        return true;
      case undefined:
        const updateObj = await this._collection
          .updateOne(this.getNotPendingFilter(filter), update, options);

        if (updateObj.matchedCount === 0) {
          throw new ClicheDbConcurrentUpdateError();
        }

        return true;
      case 'commit':
        await this._collection.updateOne(this.getReqIdPendingFilter(context),
          { ...update, ...unsetPendingOp });
        break;
      case 'abort':
        await this.releasePendingLock(context);
        break;
    }

    return undefined;
  }

  private async getPendingLock(filter: Query<T>): Promise<void> {
    const pendingUpdateObj = await this._collection.updateOne(
        filter,
        { $set: { _pending: true } });

    if (pendingUpdateObj.matchedCount === 0) {
      throw new ClicheDbNotFoundError(this._name);
    }
    if (pendingUpdateObj.modifiedCount === 0) {
      throw new ClicheDbConcurrentUpdateError();
    }
  }

  private async releasePendingLock(context: Context): Promise<void> {
    await this._collection.updateOne(
      this.getReqIdPendingFilter(context), unsetPendingOp);
  }

  private async getLockAndUpdate(
    filter: Query<T>, update: Object): Promise<void> {
    this.getPendingLock(filter);
    const updateResult = await this._collection
      .updateOne(filter, update);

    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
      // Unknown because the update to get the lock
      // had just been successfully applied on the same object.
      // No other update should have gone through in between,
      // so there is no reason for this update to have failed
      throw new ClicheDbUnknownUpdateError();
    }
  }

  private async getReqIdPendingFilter(context: Context) {
    return { '_pendingDetails.reqId': context.reqId };
  }

  private getNotPendingFilter(filter: Query<T> | undefined) {
    return Object.assign({}, filter, { _pending : { $exists: false }});
  }

  private getNotPendingCreateFilter(filter: Query<T> | undefined): Query<T> {
    return Object.assign({}, filter, {
      _pending: { $exists: false },
      '_pendingDetails.type': { $ne: `create-${this._name}` }
    });
  }

  private makePendingCreate(context: Context, doc: T): void {
    doc['_pending'] = true;
    doc['_pendingDetails'] = {
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

  collection(name: string): Collection<any> {
    if (!this._collections.has(name)) {
      this._collections.set(name, new Collection(this._db, name));
    }

    return this._collections.get(name);
  }
}
