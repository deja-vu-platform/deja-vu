import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  AllocationDoc,
  Assignment,
  ConsumerOfResourceInput,
  CreateAllocationInput,
  DeleteResourceInput,
  EditConsumerOfResourceInput
} from './schema';


const actionRequestTable: ActionRequestTable = {
  'create-allocation': (extraInfo) => `
    mutation CreateAllocation($input: CreateAllocationInput!) {
      createAllocation (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-resource': (extraInfo) => `
    mutation DeleteResource($input: DeleteResourceInput!) {
      deleteResource (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'edit-consumer': (extraInfo) => {
    switch (extraInfo.action) {
      case 'edit':
        return `
          mutation EditConsumerOfResource(
            $input: EditConsumerOfResourceInput!) {
            editConsumerOfResource (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'consumer':
        return `
          query ConsumerOfResource($input: ConsumerOfResourceInput!) {
            consumerOfResource(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-consumer': (extraInfo) => `
    query ConsumerOfResource($input: ConsumerOfResourceInput!) {
      consumerOfResource(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ClicheDb, _config: Config): IResolvers {
  const allocations: Collection<AllocationDoc> = db.collection('allocations');

  return {
    Query: {
      allocation: async (_root, { id }) => allocations.findOne({ id: id }),
      consumerOfResource: async (
        _root, { input: { resourceId, allocationId } }
          : { input: ConsumerOfResourceInput }) => {
        const alloc = await allocations
          .findOne(
            { id: allocationId, 'assignments.resourceId': resourceId },
            { projection: { 'assignments.$.consumerId': 1 } });

        return alloc.assignments[0].consumerId;
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
        _root, { input: { resourceId, allocationId, newConsumerId } }
          : { input: EditConsumerOfResourceInput }, context: Context) => {
        const updateOp = {
          $set: { 'assignments.$.consumerId': newConsumerId }
        };
        const allocFilter = {
          id: allocationId,
          'assignments.resourceId': resourceId
        };

        return await allocations.updateOne(context, allocFilter, updateOp);
      },
      createAllocation: async (
        _root, { input: { id, resourceIds, consumerIds } }
          : { input: CreateAllocationInput }, context: Context) => {
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

          return await allocations.insertOne(context, newAllocation);
      },
      deleteResource: async (
        _root, { input: { resourceId, allocationId } }
          : { input: DeleteResourceInput }, context: Context) => {
        const updateOp = {
          $pull: {
            resourceIds: resourceId,
            assignments: { resourceId: resourceId }
          }
        };
        const allocationIdFilter = { id: allocationId };

        return await allocations.updateOne(
          context, allocationIdFilter, updateOp);
      }
    }
  };
}

const allocatorCliche: ClicheServer = new ClicheServerBuilder('allocator')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const allocations: Collection<AllocationDoc> = db.collection('allocations');

    return Promise.all([
      allocations.createIndex({ id: 1 }, { unique: true }),
      allocations.createIndex(
        { id: 1, 'assignments.resourceId': 1 }, { unique: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

allocatorCliche.start();
