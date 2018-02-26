import * as minimist from 'minimist';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');


interface AllocationDoc {
  id: string;
  resourceIds: string[];
  consumerIds: string[];
  // resource -> consumer
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

const name = argv.as ? argv.as : 'event';

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
  `mongodb://${config.dbHost}:${config.dbPort}`, (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      db.collections().then(collections => {
        const drops: any[] = [];
        for (const collection of collections) {
          console.log(`Dropping ${collection.collectionName}`);
          drops.push(db.dropCollection(collection.collectionName));
        }
        return Promise.all(drops).then(unused => {
          allocations = db.collection('allocations');
          resources = db.collection('resources');
          consumers = db.collection('consumers');
          if (!_.isEmpty(config.initialConsumerIds)) {
            return consumers.insertMany(_.map(config.initialConsumerIds, id => ({id: id})))
              .then(unusedResult => {
                console.log(
                  `Initialized consumer set with ${config.initialConsumerIds}`);
              });
          }
        });
      });
    } else {
      allocations = db.collection('allocations');
      resources = db.collection('resources');
      consumers = db.collection('consumers');
    }
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];


const resolvers = {
  Query: {
    allocation: (root, { id }) => allocations.findOne({ id: id }),
    resources: root => resources.find().toArray(),
    consumers: root => consumers.find().toArray(),
    consumerOfResource: (root, { resourceId, allocationId }) => allocations
      .findOne({ id: allocationId })
      .then(allocation => consumers
        .findOne({id: allocation.assignments[resourceId]}))
  },
  Allocation: {
    id: (allocation: AllocationDoc) => allocation.id,
    resources: (allocation: AllocationDoc) => resources
      .find({ id: { $in: allocation.resourceIds } }).toArray(),
    consumers: (allocation: AllocationDoc) => consumers
      .find({ id: { $in: allocation.consumerIds } }).toArray(),
  },
  Resource: {
    id: (resource: ResourceDoc) => resource.id
  },
  Consumer: {
    id: (consumer: ConsumerDoc) => consumer.id
  },
  Mutation: {
    editConsumerOfResource: (
      root, {resourceId, allocationId, newConsumerId}) => {
      return Promise
        .all([
          Validation.resourceExists(resourceId),
          Validation.consumerExists(newConsumerId)
        ])
        .then(unused => {
          const updateOp = {
            $set: { [`assignments.${resourceId}`]: newConsumerId }
          };
          return resources
            .updateOne({ id: resourceId }, updateOp)
            .then(unusedUpdate => true);
      });
    },
    createAllocation: (root, {id, resourceIds}) => {
      return consumers.find().toArray()
        .then(allConsumers => {
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
          return allocations.insertOne(newAllocation)
            .then(unusedInsert => newAllocation);
        });
    },
    createResource: (root, {id}) => {
      const resourceId = id ? id : uuid();
      const newResource: ResourceDoc = { id: resourceId };
      return resources.insertOne(newResource).then(unused => newResource);
    },
  }
};

namespace Validation {
  export function resourceExists(resourceId: string) {
    return resources
      .findOne({ id: resourceId })
      .then((resource: ResourceDoc) => {
        if (!resource) {
          throw new Error(`Resource ${resourceId} not found`);
        }
        return resource;
      });
  }

  export function consumerExists(consumerId) {
    return consumers
      .findOne({ id: consumerId })
      .then((consumer: ConsumerDoc) => {
        if (!consumer) {
          throw new Error(`Consumer ${consumerId} not found`);
        }
        return consumer;
      });
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers });


const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
