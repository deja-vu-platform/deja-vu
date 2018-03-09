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
  // Map of resource -> consumer
  assignments: { [resourceId: string]: string };
}

interface ResourceDoc {
  id: string;
}

interface ConsumerDoc {
  id: string;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  initialConsumerIds: string[];
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'allocator';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  initialConsumerIds: [],
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
let db, allocations, resources, consumers;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
      if (!_.isEmpty(config.initialConsumerIds)) {
        await db.collection('consumers')
          .insertMany(_.map(config.initialConsumerIds, (id) => ({id: id})));
        console.log(
          `Initialized consumer set with ${config.initialConsumerIds}`);
      }
    }
    allocations = db.collection('allocations');
    resources = db.collection('resources');
    consumers = db.collection('consumers');
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async resourceExists(resourceId: string) {
    return Validation.exists(resources, resourceId, 'Resource');
  }

  static async consumerExists(consumerId: string) {
    return Validation.exists(consumers, consumerId, 'Consumer');
  }

  static async allocationExists(allocationId: string) {
    return Validation.exists(allocations, allocationId, 'Allocation');
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }
}

const resolvers = {
  Query: {
    allocation: (root, { id }) => allocations.findOne({ id: id }),
    resources: (root) => resources.find()
      .toArray(),
    consumers: (root) => consumers.find()
      .toArray(),
    consumerOfResource: async (root, { resourceId, allocationId }) => {
      const allocation: AllocationDoc = await allocations
        .findOne({ id: allocationId });

      return consumers.findOne({id: allocation.assignments[resourceId]});
    }
  },
  Allocation: {
    id: (allocation: AllocationDoc) => allocation.id,
    resources: (allocation: AllocationDoc) => resources
      .find({ id: { $in: allocation.resourceIds } })
      .toArray(),
    consumers: (allocation: AllocationDoc) => consumers
      .find({ id: { $in: allocation.consumerIds } })
      .toArray()
  },
  Resource: {
    id: (resource: ResourceDoc) => resource.id
  },
  Consumer: {
    id: (consumer: ConsumerDoc) => consumer.id
  },
  Mutation: {
    editConsumerOfResource: async (
      root, {resourceId, allocationId, newConsumerId}) => {
        await Promise.all([
          Validation.resourceExists(resourceId),
          Validation.consumerExists(newConsumerId),
          Validation.allocationExists(allocationId)
        ]);
        const updateOp = {
          $set: { [`assignments.${resourceId}`]: newConsumerId }
        };
        await allocations.updateOne({ id: allocationId }, updateOp);

        return true;
    },
    createAllocation: async (root, {id, resourceIds, saveResources}) => {
      const allConsumers = await consumers.find()
        .toArray();
      const consumerIds = _.map(allConsumers, 'id');
      const assignments = {};
      if (!_.isEmpty(consumerIds)) {
        let currentConsumerIndex = 0;
        for (const resourceId of resourceIds) {
          const c = consumerIds[currentConsumerIndex];
          console.log(`Allocating ${resourceId} to ${c}`);
          assignments[resourceId] = c;
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
      if (saveResources) {
        await resources.insertMany(
          _.map(resourceIds, (resourceId) => ({id: resourceId})));
      }
      await allocations.insertOne(newAllocation);

      return newAllocation;
    },
    createResource: async (root, {id}) => {
      const resourceId = id ? id : uuid();
      const newResource: ResourceDoc = { id: resourceId };
      await resources.insertOne(newResource);

      return newResource;
    },
    deleteResource: async (root, {id}) => {
      await resources.deleteOne({id: id});

      return {id: id};
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
