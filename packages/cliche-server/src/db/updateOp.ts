import * as mongodb from 'mongodb';
import { Context, Query } from './db';
import { DbDoc, unsetPendingOp } from './dbWithPendingLocks';


export interface UpdateOp<T> {
  filter: Query<DbDoc<T>>;
  update: DbDoc<T> | mongodb.UpdateQuery<DbDoc<T>>;
  upsert?: boolean;
}

export function releaseLockOp<T>(
  context: Context, filter: Query<T>): UpdateOp<DbDoc<T>> {
  return {
    filter: getReqIdPendingFilter(context, filter),
    update: unsetPendingOp
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
