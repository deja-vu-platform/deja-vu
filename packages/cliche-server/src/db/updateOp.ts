import * as mongodb from 'mongodb';
import { Context, Query } from './db';
import { DbDoc, unsetPendingOp } from './db2PC';


export interface UpdateOp<T> {
  filter: Query<DbDoc<T>>;
  update: DbDoc<T> | mongodb.UpdateQuery<DbDoc<T>>;
  upsert?: boolean;
}

export function getPendingLockOp<T>(filter: Query<T>): UpdateOp<DbDoc<T>> {
  return {
    filter,
    update: { $set: { _pending: true } }
    // upsert should not be true because any new/upserted doc should have
    // a pending create indicator so that it doesn't get returned by find()
    // we can't include _pendingDetails (with that indicator) in our scheme
  };
}

export function releaseLockOp<T>(
  context: Context, filter: Query<T>): UpdateOp<DbDoc<T>> {
  return {
    filter: getReqIdPendingFilter(context, filter),
    update: unsetPendingOp
  };
}

export function addPendingDetailsOp<T>(context: Context,
  updateOp: UpdateOp<T>, updateType: string): UpdateOp<DbDoc<T>> {
  const updateSetOp = {
    // make sure to include any $set ops from `update`
    ...updateOp.update['$set'],
    _pendingDetails: {
      reqId: context.reqId,
      type: updateType
    }
  };

  return {
    filter: updateOp.filter,
    update: Object.assign({}, updateOp.update, { $set: updateSetOp }),
    upsert: updateOp.upsert
  };
}

/**
 * Get the query for obtaining all the documents
 * that the given context has the lock to
 */
export function getReqIdPendingFilter<T>(
  context: Context, filter: Query<T> = {}): Query<DbDoc<T>> {
  return Object.assign(
    {}, filter, { '_pendingDetails.reqId': context.reqId });
}
