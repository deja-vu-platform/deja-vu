import * as minimist from 'minimist';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongodb from 'mongodb';
import { readFileSync } from 'fs';
import * as path from 'path';

const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');


interface AllocationDoc {
  id: string;
  resourceIds: string[];
}

interface ResourceDoc {
  id: string;
  assignedToId: string;
}

interface ConsumerDoc {
  id: string;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'event';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

const resolvers = {
  Query: {
    allocation: (root, { id }) => db.collection('allocations').findOne({ id: id })
  },
  Allocation: {
    id: (allocation: AllocationDoc) => allocation.id,
    resources: (allocation: AllocationDoc) => db.collection('resources')
      .find({ id: { $in: allocation.resourceIds } }).toArray()
  },
  Resource: {
    id: (resource: ResourceDoc) => resource.id,
    assignedTo: (resource: ResourceDoc) => {
      if (resource.assignedToId === undefined) {
        // todo: need to lock until this is done
        // Trigger round-robin allocation
        return db.collection('allocations')
          .findOne({resourceIds: resource.id})
          .then((allocation: AllocationDoc) => db.collection('consumers')
            .find()
            .toArray()
            .then((consumers: ConsumerDoc[]) => {
              let assignedTo = '';
              const updates: Promise<any>[] = [];

              let currentConsumerIndex = 0;
              for (const resourceId of allocation.resourceIds) {
                const c = consumers[currentConsumerIndex];
                console.log(`Allocating ${resourceId} to ${c.id}`);
                if (resourceId === resource.id) {
                  assignedTo = c.id;
                }
                updates.push(
                  db.collection('resources')
                    .updateOne({id: resourceId},
                               {$set: {assignedToId: c.id}}));
                currentConsumerIndex = (
                  currentConsumerIndex + 1) % consumers.length;
              }
              return Promise.all(updates)
                .then(_ => db.collection('consumers')
                    .findOne({id: assignedTo}));
            }));
      } else {
        return db.collection('consumers')
          .findOne({id: resource.assignedToId});
      }
    }
  },
  Consumer: {
    id: (consumer: ConsumerDoc) => consumer.id
  },
  Mutation: {
    editConsumer: (root, {resourceId, newConsumerId}) => {
      return Promise
        .all([
          Validation.resourceExists(resourceId),
          Validation.consumerExists(newConsumerId)
        ])
        .then(unused => {
          const updateOp = { $set: { 'assignedToId': newConsumerId } };
          return db.collection('resources')
            .updateOne({ id: resourceId }, updateOp)
            .then(_ => true);
      });
    }
  }
};

namespace Validation {
  export function resourceExists(resourceId: string) {
    return db.collection('resources')
      .findOne({ id: resourceId })
      .then((resource: ResourceDoc) => {
        if (!resource) {
          throw new Error(`Resource ${resourceId} not found`);
        }
        return resource;
      });
  }

  export function consumerExists(consumerId) {
    return db.collection('consumers')
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
