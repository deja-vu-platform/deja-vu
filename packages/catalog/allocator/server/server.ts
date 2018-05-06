import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';


interface AllocationDoc {
  id: string;
  resourceIds: string[];
  consumerIds: string[];
  assignments: Assignment[];
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-allocation' | 'delete-resource' | 'edit-consumer';
}

interface Assignment {
  resourceId: string;
  consumerId: string;
}

interface EditConsumerOfResourceInput {
  resourceId: string;
  allocationId: string;
  newConsumerId: string;
}

interface ConsumerOfResourceInput {
  resourceId: string;
  allocationId: string;
}

interface CreateAllocationInput {
  id?: string;
  resourceIds: string[];
  consumerIds: string[];
}

interface DeleteResourceInput {
  resourceId: string;
  allocationId: string;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'allocator';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db, allocations: mongodb.Collection<AllocationDoc>;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    allocations = db.collection('allocations');
    allocations.createIndex({ id: 1 }, { unique: true });
    allocations.createIndex(
      { id: 1, 'assignments.resourceId': 1 }, { unique: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async allocationExistsOrFail(id: string): Promise<void> {
    const alloc: AllocationDoc | null = await allocations
      .findOne({ id: id }, { projection: { _id: 1 } });
    if (alloc === null) {
      throw new Error(`Allocation ${id} doesn't exist `);
    }
  }

  static async resourceIsPartOfAllocationOrFail(
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

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(alloc: AllocationDoc | null) {
  return _.get(alloc, 'pending.type') === 'create-allocation';
}

const resolvers = {
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
        switch (context.reqType) {
          case 'vote':
            await Validation.resourceIsPartOfAllocationOrFail(
              allocationId, resourceId);
            const pendingUpdateObj = await allocations
              .updateOne(
                {
                  id: allocationId,
                  'assignments.resourceId': resourceId,
                  pending: { $exists: false }
                },
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
            await Validation.resourceIsPartOfAllocationOrFail(
              allocationId, resourceId);
            const updateObj = await allocations
              .updateOne(
                {
                  id: allocationId,
                  'assignments.resourceId': resourceId,
                  pending: { $exists: false }
                },
                updateOp);
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

    },
    createAllocation: async (
      root, { input: { id, resourceIds, consumerIds } }
      : { input: CreateAllocationInput }, context: Context) => {
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
              { 'pending.reqId': context.reqId },
              { $unset: { pending: '' } });

            return;
          case 'abort':
            await allocations.deleteOne({ 'pending.reqId': context.reqId });

            return;
        }
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
      switch (context.reqType) {
        case 'vote':
          await Validation.allocationExistsOrFail(allocationId);
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
          await Validation.allocationExistsOrFail(allocationId);
          const updateObj = await allocations.updateOne(
            { id: allocationId, pending: { $exists: false} }, updateOp);

          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case 'commit':
          await allocations.updateOne(
            { 'pending.reqId': context.reqId },
            { ...updateOp, $unset: { pending: '' } });

          return;
        case 'abort':
          await allocations.updateOne(
            { 'pending.reqId': context.reqId }, { $unset: { pending: '' } });

          return;
      }
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
