import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { Validation } from './validation';

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
export const EMPTY_CONTEXT: Context =
  { reqType: undefined, runId: '', reqId: '' };

/**
 * The error message to include when there is a concurrent update in the server.
 */
const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

const unsetPendingOp = { $unset: { _pending: '' } };

function getReqIdPendingFilter(context: Context) {
  return { '_pending.reqId': context.reqId };
}

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

  private readonly DEFAULT_VALIDATE_FN = async (id: string) =>
    // TODO: will this use the correct `this`?
    await Validation.existsOrFail(this, id, this._name)

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
  //   options?: mongodb.CommonOptions,
  //   validateFn?: Function): Promise<boolean> {
  //   // TODO
  // }

  async deleteOne(context: Context, filter: Query<T>,
    validateFn?: Function): Promise<boolean> {
    filter['_pending'] = { $exists: false };

    switch (context.reqType) {
      case 'vote':
        validateFn ? validateFn() : this.DEFAULT_VALIDATE_FN(filter['id']);
        const pendingUpdateObj = await this._collection.updateOne(
          filter,
          {
            $set: {
              _pending: {
                reqId: context.reqId,
                type: `delete-${this._name}`
              }
            }
          });

        if (pendingUpdateObj.matchedCount === 0) {
          throw new Error(CONCURRENT_UPDATE_ERROR);
        }

        return true;
      case undefined:
        validateFn ? validateFn() : this.DEFAULT_VALIDATE_FN(filter['id']);
        const res = await this._collection.deleteOne(filter);

        if (res.deletedCount === 0) {
          throw new Error(CONCURRENT_UPDATE_ERROR);
        }

        return true;
      case 'commit': {
        await this._collection.deleteOne(getReqIdPendingFilter(context));
      }
      case 'abort': {
        await this._collection.updateOne(
          getReqIdPendingFilter(context), unsetPendingOp);
      }
    }

    return undefined;
  }

  async find(query?: Query<T>, options?: mongodb.FindOneOptions): Promise<T[]> {
    const queryNotPendingCreate: Query<T> = query ? query : {};
    queryNotPendingCreate['_pending.type'] = { $ne: `create-${this._name}` };

    return await this._collection
      .find(queryNotPendingCreate, options)
      .toArray();
  }

  async findOne(query: Query<T>, options?: mongodb.FindOneOptions): Promise<T> {
    query['_pending.type'] = { $ne: `create-${this._name}` };

    // TODO: This returns null if it's not found.
    // Should it throw an error instead or not and let clients
    // handle it themselves?
    return await this._collection.findOne(query, options);
  }

  async insertMany(context: Context, docs: T[],
    options?: mongodb.CollectionInsertManyOptions): Promise<T[]> {
    switch (context.reqType) {
      case 'vote':
        _.each(docs, (doc) => {
          doc['_pending'] = { reqId: context.reqId };
        });
        /* falls through */
      case undefined:
        await this._collection.insertMany(docs, options);

        return docs;
      case 'commit': {
        await this._collection.updateMany(
          getReqIdPendingFilter(context), unsetPendingOp);
      }
      case 'abort': {
        await this._collection.deleteMany(getReqIdPendingFilter(context));
      }
    }

    return docs;
  }

  async insertOne(context: Context, doc: T,
    options?: mongodb.CollectionInsertOneOptions): Promise<T> {
    switch (context.reqType) {
      case 'vote':
        doc['_pending'] = {
          reqId: context.reqId,
          type: `create-${this._name}`
        };
      /* falls through */
      case undefined:
        await this._collection.insertOne(doc, options);

        return doc;
      case 'commit': {
        await this._collection.updateOne(
          getReqIdPendingFilter(context), unsetPendingOp);
      }
      case 'abort': {
        await this._collection.deleteOne(getReqIdPendingFilter(context));
      }
    }

    return doc;
  }

  // async updateMany(context: Context, filter: Query<T>, update: Object,
  //   options?: mongodb.CommonOptions & { upsert?: boolean },
  //   validateFn?: Function): Promise<boolean> {
  //   // TODO
  // }

  async updateOne(context: Context, filter: Query<T>, update: Object,
    options?: mongodb.ReplaceOneOptions,
    validateFn?: Function): Promise<boolean> {
    filter['_pending'] = { $exists: false };

    switch (context.reqType) {
      case 'vote':
        validateFn ? validateFn() : this.DEFAULT_VALIDATE_FN(filter['id']);
        const pendingUpdateObj = await this._collection
          .updateOne(
            filter,
            {
              $set: {
                _pending: {
                  reqId: context.reqId,
                  type: `update-${this._name}`
                }
              }
            });
        if (pendingUpdateObj.matchedCount === 0) {
          throw new Error(CONCURRENT_UPDATE_ERROR);
        }

        return true;
      case undefined:
        validateFn ? validateFn() : this.DEFAULT_VALIDATE_FN(filter['id']);
        const updateObj = await this._collection
          .updateOne(filter, update, options);
        if (updateObj.matchedCount === 0) {
          throw new Error(CONCURRENT_UPDATE_ERROR);
        }

        return true;
      case 'commit': {
        await this._collection.updateOne(
          getReqIdPendingFilter(context),
          { ...update, ...unsetPendingOp });
      }
      case 'abort': {
        await this._collection.updateOne(
          getReqIdPendingFilter(context), unsetPendingOp);
      }
    }

    return undefined;
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
