import {
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  Validation
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  AllocationDoc,
  Assignment,
  ConsumerOfResourceInput,
  CreateAllocationInput,
  DeleteResourceInput,
  EditConsumerOfResourceInput,
  PendingDoc
} from './schema';
import { v4 as uuid } from 'uuid';


class AllocationValidation {
  static async allocationExistsOrFail(
    allocations: mongodb.Collection<AllocationDoc>,
    id: string): Promise<AllocationDoc> {
    return Validation.existsOrFail(allocations, id, 'Allocation');
  }

  static async resourceIsPartOfAllocationOrFail(
    allocations: mongodb.Collection<AllocationDoc>,
    allocationId: string, resourceId: string): Promise<void> {
    const alloc: AllocationDoc | null = await allocations
      .findOne(
        {id: allocationId, 'assignments.resourceId': resourceId},
        { projection: { _id: 1 } });
    if (alloc === null) {
      throw new Error(
        `Resource ${resourceId} is not part of allocation ` +
        `${allocationId}`);
    }
  }
}

function isPendingCreate(alloc: AllocationDoc | null) {
  return _.get(alloc, 'pending.type') === 'create-allocation';
}

function resolvers(db: mongodb.Db, config: Config): object {
  const allocations: mongodb.Collection<AllocationDoc> =
    db.collection('allocations');
  return {
    Query: {
      allocation: async (root, { id }) => {
        const alloc: AllocationDoc | null = await allocations
          .findOne({ id: id });
        if (isPendingCreate(alloc)) {
          return null;
        }

        return alloc;
      },
      consumerOfResource: async (
        root, { input: { resourceId, allocationId } }
        : { input: ConsumerOfResourceInput }) => {
        const alloc: AllocationDoc | null = await allocations
          .findOne(
            { id: allocationId, 'assignments.resourceId': resourceId },
            { projection: { 'assignments.$.consumerId': 1, 'pending.type': 1 } });

        if (_.isNil(alloc) || isPendingCreate(alloc)) {
          throw new Error(
            `Allocation ${allocationId} or resource ${resourceId} not found`);
        }

        return alloc!.assignments[0].consumerId;
      }
    },
    Allocation: {
      id: (allocation: AllocationDoc) => allocation.id,
      resourceIds: (allocation: AllocationDoc) => allocation.resourceIds,
      consumerIds: (allocation: AllocationDoc) => allocation.consumerIds
    },

    // To keep it simple we allow at most one pending change per document.
    // We vote 'no' if a document we would have to modify has a pending change
    // even if the update would be OK. Our docs are allocations so this would
    // only happen if we get concurrent modifications to the same allocation
    // (e.g., editing a consumer) which shouldn't happen often.
    Mutation: {
      editConsumerOfResource: async (
        root, { input: { resourceId, allocationId, newConsumerId } }
        : { input: EditConsumerOfResourceInput }, context: Context) => {
          const updateOp = {
            $set: { 'assignments.$.consumerId': newConsumerId }
          };
          const notPendingAllocFilter = {
            id: allocationId,
            'assignments.resourceId': resourceId,
            pending: { $exists: false }
          };
          switch (context.reqType) {
            case 'vote':
              await AllocationValidation.resourceIsPartOfAllocationOrFail(
                allocations, allocationId, resourceId);
              const pendingUpdateObj = await allocations
                .updateOne(
                  notPendingAllocFilter,
                  {
                    $set: {
                      pending: {
                        reqId: context.reqId,
                        type: 'edit-consumer'
                      }
                    }
                  });
              if (pendingUpdateObj.matchedCount === 0) {
                throw new Error(CONCURRENT_UPDATE_ERROR);
              }

              return true;
            case undefined:
              await AllocationValidation.resourceIsPartOfAllocationOrFail(
                allocations, allocationId, resourceId);
              const updateObj = await allocations
                .updateOne(notPendingAllocFilter, updateOp);
              if (updateObj.matchedCount === 0) {
                throw new Error(CONCURRENT_UPDATE_ERROR);
              }

              return true;
            case 'commit':
              await allocations.updateOne(
                {
                  id: allocationId,
                  'assignments.resourceId': resourceId,
                  'pending.reqId': context.reqId
                },
                { ...updateOp, $unset: { pending: '' } });

              return;
            case 'abort':
              await allocations.updateOne(
                { 'pending.reqId': context.reqId }, { $unset: { pending: '' } });

              return;
          }
          return;
      },
      createAllocation: async (
        root, { input: { id, resourceIds, consumerIds } }
        : { input: CreateAllocationInput }, context: Context) => {
          const reqIdPendingFilter = { 'pending.reqId': context.reqId };
          let pending: PendingDoc | undefined;
          switch (context.reqType) {
            case 'vote':
              pending = { reqId: context.reqId, type: 'create-allocation' };
              /* falls through */
            case undefined:
              const assignments: Assignment[] = [];
              if (!_.isEmpty(consumerIds)) {
                let currentConsumerIndex = 0;
                for (const resourceId of resourceIds) {
                  const consumerId = consumerIds[currentConsumerIndex];
                  console.log(`Allocating ${resourceId} to ${consumerId}`);
                  assignments.push({
                    resourceId: resourceId, consumerId: consumerId
                  });
                  currentConsumerIndex = (
                    currentConsumerIndex + 1) % consumerIds.length;
                }
              }
              const newAllocation: AllocationDoc = {
                id: id ? id : uuid(),
                resourceIds: resourceIds,
                consumerIds: consumerIds,
                assignments: assignments
              };
              if (pending) {
                newAllocation.pending = pending;
              }
              await allocations.insertOne(newAllocation);

              return newAllocation;
            case 'commit':
              await allocations.updateOne(
                reqIdPendingFilter, { $unset: { pending: '' } });

              return;
            case 'abort':
              await allocations.deleteOne(reqIdPendingFilter);

              return;
          }
          return;
      },
      deleteResource: async (
        root, { input: { resourceId, allocationId } }
        : { input: DeleteResourceInput }, context: Context) => {
        const updateOp = {
          $pull: {
            resourceIds: resourceId,
            assignments: { resourceId: resourceId }
          }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            await AllocationValidation.allocationExistsOrFail(
              allocations, allocationId);
            const pendingUpdateObj = await allocations.updateOne(
              { id: allocationId, pending: { $exists: false } },
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'delete-resource'
                  }
                }
              });

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await AllocationValidation.allocationExistsOrFail(
              allocations, allocationId);
            const updateObj = await allocations.updateOne(
              { id: allocationId, pending: { $exists: false} }, updateOp);

            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await allocations.updateOne(
              reqIdPendingFilter, { ...updateOp, $unset: { pending: '' } });

            return;
          case 'abort':
            await allocations.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return;
        }
        return;
      }
    }
  };
};

const allocatorCliche: ClicheServer = new ClicheServerBuilder('allocator')
  .initDb((db: mongodb.Db, config: Config): Promise<any> => {
    const allocations = db.collection('allocations');
    return Promise.all([
      allocations.createIndex({ id: 1 }, { unique: true }),
      allocations.createIndex(
        { id: 1, 'assignments.resourceId': 1 }, { unique: true })
    ]);
  })
  .resolvers(resolvers)
  .build();

allocatorCliche.start();
