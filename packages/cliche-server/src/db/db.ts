import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { Collection2PC } from './db2PC';

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

/**
 * Wrapper around the MongoDb Node.js driver
 * to add support for Déjà Vu's transaction handling,
 * exposing only the relevant methods for DV cliché servers.
 *
 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html
 */
export interface Collection<T extends Object> {
  aggregate(pipeline: Object[], options?: mongodb.CollectionAggregationOptions):
    mongodb.AggregationCursor<T>;

  createIndex(fieldOrSpec: string | any,
    options?: mongodb.IndexOptions): Promise<string>;

  // deleteMany(context: Context, filter: Query<T>,
  //   options?: mongodb.CommonOptions): Promise<boolean>;

  deleteOne(context: Context, filter: Query<T>): Promise<boolean>;

  find(query?: Query<T>, options?: mongodb.FindOneOptions): Promise<T[]>;

  findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T>;

  insertMany(context: Context, docs: T[],
    options?: mongodb.CollectionInsertManyOptions): Promise<T[]>;

  insertOne(context: Context, doc: T,
    options?: mongodb.CollectionInsertOneOptions): Promise<T>;

  updateMany(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.CommonOptions & { upsert?: boolean }): Promise<boolean>;

  updateOne(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.ReplaceOneOptions): Promise<boolean>;
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
  collection<T>(name: string): Collection<T> {
    if (!this._collections.has(name)) {
      this._collections.set(name, new Collection2PC<T>(this._db, name));
    }

    return this._collections.get(name);
  }
}
