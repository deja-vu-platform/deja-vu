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
  id: string;
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
let db: mongodb.Db, allocations: mongodb.Collection;
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

const resolvers = {
  Query: {
    allocation: (root, { id }) => allocations.findOne({ id: id }),
    consumerOfResource: async (
      root, { input: { resourceId, allocationId } }
      : { input: ConsumerOfResourceInput }) => {
      const allocation: AllocationDoc = await allocations
        .findOne(
          { id: allocationId, 'assignments.resourceId': resourceId },
          { projection: { 'assignments.$.consumerId': 1 } });

      return allocation.assignments[0].consumerId;
    }
  },
  Allocation: {
    id: (allocation: AllocationDoc) => allocation.id,
    resourceIds: (allocation: AllocationDoc) => allocation.resourceIds,
    consumerIds: (allocation: AllocationDoc) => allocation.consumerIds
  },
  Mutation: {
    editConsumerOfResource: async (
      root, { input: { resourceId, allocationId, newConsumerId } }
      : { input: EditConsumerOfResourceInput }) => {
        const updateOp = {
          $set: { 'assignments.$.consumerId': newConsumerId }
        };
        const updateObj = await allocations
          .updateOne(
            { id: allocationId, 'assignments.resourceId': resourceId },
            updateOp);
        if (updateObj.matchedCount === 0) {
          throw new Error(`
            Resource ${resourceId} is not part of allocation ${allocationId}`);
        }

        return true;
    },
    createAllocation: async (
      root, { input: { id, resourceIds, consumerIds } }
      : { input: CreateAllocationInput }) => {
      const assignments: Assignment[] = [];
      if (!_.isEmpty(consumerIds)) {
        let currentConsumerIndex = 0;
        for (const resourceId of resourceIds) {
          const consumerId = consumerIds[currentConsumerIndex];
          console.log(`Allocating ${resourceId} to ${consumerId}`);
          assignments.push({ resourceId: resourceId, consumerId: consumerId });
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
      await allocations.insertOne(newAllocation);

      return newAllocation;
    },
    deleteResource: async (
      root, { input: { resourceId, allocationId } }
      : { input: DeleteResourceInput }) => {
      const updateObj = await allocations
        .updateOne({ id: allocationId },
          { $pull: {
            resourceIds: resourceId,
            assignments: { resourceId: resourceId }
          }});

      return updateObj.modifiedCount === 1;
    }
  }
};


const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
