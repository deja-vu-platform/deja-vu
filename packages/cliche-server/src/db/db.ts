import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { CollectionWithPendingLocks } from './dbWithPendingLocks';

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

export function isSuccessfulContext(context: Context): boolean {
  return context.reqType == undefined || context.reqType == 'commit';
}

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

export interface UpsertOptions {
  upsert?: boolean;
  setOnInsert?: Object;
}

/**
 * Wrapper around the MongoDb Node.js driver
 * to add support for Déjà Vu's transaction handling,
 * exposing only the relevant methods for DV cliché servers.
 *
 * Each of the methods exposed are individually guaranteed to be atomic.
 * To perform operations across Collection<T>s in a transaction,
 * use ClicheDb.inTransaction()
 *
 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html
 */
export interface Collection<T extends Object> {
  /** http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#aggregate */
  aggregate(pipeline: Object[], options?: mongodb.CollectionAggregationOptions):
    mongodb.AggregationCursor<T>;

  /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#createIndex */
  createIndex(fieldOrSpec: string | any,
    options?: mongodb.IndexOptions): Promise<string>;

  /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#countDocuments */
  countDocuments(
    query?: Query<T>, options?: mongodb.MongoCountPreferences): Promise<number>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#deleteMany
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses). This fails if a document that would have
   * been deleted cannot be deleted because another update on it is in progress.
   */
  deleteMany(context: Context, filter: Query<T>,
    options?: mongodb.CommonOptions): Promise<boolean>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#deleteOne
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses). This fails if a document that would have
   * been deleted cannot be deleted because another update on it is in progress.
   */
  deleteOne(context: Context, filter: Query<T>): Promise<boolean>;

  /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#find */
  find(query?: Query<T>): Promise<T[]>;

  /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#find */
  findCursor(query?: Query<T>): Promise<mongodb.Cursor<T>>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOne
   *
   * @throws ClicheDbNotFoundError if there were no matches to the query
   */
  findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T>;

  /**
   * Similar to:
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param updateFn called on the fetched doc to generate the update operation
   *                        to apply to the document. If the return value is
   *                        undefined, the doc is deleted. Else, that is the
   *                        update operation used as defined by mongodb.
   *                        If a doc is upserted, the doc with only the
   *                        options.setOnInsert fields are passed in.
   *                        This method ensures that the doc passed into
   *                        updateFn is locked and has not and will not change
   *                        from the time the method voted 'yes' to the update,
   *                        until the update operation finishes.
   * @param options the regular mongodb updateOne options,
   *                    plus setOnInsert which is equivalent to
   *                    the mongodb update operation $setOnInsert
   * @param validationFn called on the fetched or upserted doc as defined above.
   *                            This method ensures that the doc passed into
   *                            validationFn is locked and will not change.
   *                            Errors thrown by the function are caught so that
   *                            the method can roll back any changes,
   *                            then rethrows the error.
   * @return the document passed into the updateFn and the validationFn
   *                      if in the voting phase or not in a transaction,
   *                      undefined otherwise
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses)
   */
  findOneAndUpdateWithFn(context: Context, filter: Query<T>,
    updateFn: (doc: T) => Object | undefined,
    options?: mongodb.ReplaceOneOptions & UpsertOptions,
    validationFn?: (doc: T) => any): Promise<T | undefined>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#insertMany
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses),
   * including enforcement of uniqueness constraints by created indices
   */
  insertMany(context: Context, docs: T[],
    options?: mongodb.CollectionInsertManyOptions): Promise<T[]>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#insertOne
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses),
   * including enforcement of uniqueness constraints by created indices
   */
  insertOne(context: Context, doc: T,
    options?: mongodb.CollectionInsertOneOptions): Promise<T>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses). This fails if a document that would have
   * been changed cannot be updated because another update on it is in progress.
   */
  updateMany(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.UpdateManyOptions): Promise<boolean>;

  /**
   * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#deleteMany
   *
   * @throws ClicheDbError with the relevant error code and error message
   * (see ClicheDbError subclasses). This fails if a document that would have
   * been changed cannot be updated because another update on it is in progress.
   */
  updateOne(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.ReplaceOneOptions): Promise<boolean>;
}

export class ClicheDb {
  private readonly _client: mongodb.MongoClient;
  private readonly _db: mongodb.Db;
  private readonly _collections: Map<string, Collection<any>> =
    new Map<string, Collection<any>>();

  constructor(client: mongodb.MongoClient, db: mongodb.Db) {
    this._client = client;
    this._db = db;
  }

  /**
   * Get the collection with the given name from the database.
   */
  collection<T>(name: string): Collection<T> {
    if (!this._collections.has(name)) {
      this._collections.set(
        name, new CollectionWithPendingLocks<T>(this._db, name));
    }

    return this._collections.get(name);
  }

  /**
   * Execute operations within a transaction.
   * Recommended for use only when applying operations to multiple collections.
   * @param  fn the function to execute
   * @return the value return by the given function
   */
  async inTransaction(fn: () => Promise<any>): Promise<any> {
    let returnVal = undefined;
    this._client.withSession(async (session) => {
      session.startTransaction();
      try {
        returnVal = await fn();
        await session.commitTransaction();

        return;
      } catch (err) {
        await session.abortTransaction();
        throw err;
      }
    });

    return returnVal;
  }
}
