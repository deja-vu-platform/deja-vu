import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

interface LabelDoc {
  id: string;
  itemIds?: string[];
}

interface LabelsInput {
  itemId?: string;
}

interface ItemsInput {
  labelIds?: string[];
}

interface AddLabelsToItemInput {
  itemId: string;
  labelIds: string[];
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'label';

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

const config: Config = { ...DEFAULT_CONFIG, ...configArg };

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);

let db: mongodb.Db;
let labels: mongodb.Collection<LabelDoc>;
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

    labels = db.collection('labels');
    labels.createIndex({ id: 1 }, { unique: true, sparse: true });
    labels.createIndex({ id: 1, itemIds: 1 }, { unique: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

function standardizeLabel(id: string): string {
  return id.trim()
    .toLowerCase();
}

const resolvers = {
  Query: {
    label: async (root, { id }) => {
      const label = await labels.findOne({ id: standardizeLabel(id) });
      if (_.isEmpty(label)) { throw new Error(`Label ${id} not found`); }

      return label;
    },

    items: async (root, { input }: { input: ItemsInput }) => {
      const matchQuery = {};
      const groupQuery = { _id: 0, itemIds: { $push: '$itemIds' } };
      const reduceOperator = {};
      let initialValue;

      if (input.labelIds) {
        // Items matching all labelIds
        const standardizedLabelIds = _.map(input.labelIds, standardizeLabel);
        matchQuery['id'] = { $in: standardizedLabelIds };
        groupQuery['initialSet'] = { $first: '$itemIds' };
        initialValue = '$initialSet';
        reduceOperator['$setIntersection'] = ['$$value', '$$this'];
      } else {
        // No label filter
        initialValue = [];
        reduceOperator['$setUnion'] = ['$$value', '$$this'];
      }
      const results = await labels.aggregate([
        { $match: matchQuery },
        {
          $group: groupQuery
        },
        {
          $project: {
            itemIds: {
              $reduce: {
                input: '$itemIds',
                initialValue: initialValue,
                in: reduceOperator
              }
            }
          }
        }
      ])
        .toArray();

      return !_.isEmpty(results) ? results[0].itemIds : [];
    },

    labels: async (root, { input }: { input: LabelsInput }) => {
      const query = {}; // No labels filter
      if (input.itemId) {
        // Labels of an item
        query['itemIds'] = input.itemId;
      }

      return labels.find(query)
        .toArray();
    }
  },

  Label: {
    id: (label: LabelDoc) => label.id,
    itemIds: (label: LabelDoc) => label.itemIds
  },

  Mutation: {
    addLabelsToItem: async (root, { input }: { input: AddLabelsToItemInput }) =>
    // tslint:disable-next-line:one-line
    {
      const labelIds = _.map(input.labelIds, standardizeLabel);

      const bulkUpdateOps = _.map(labelIds, (labelId) => {
        return {
          updateOne: {
            filter: { id: labelId },
            update: {
              $push: { itemIds: input.itemId }
            },
            upsert: true
          }
        };
      });

      const result = await labels.bulkWrite(bulkUpdateOps);
      const modified = result.modifiedCount ? result.modifiedCount : 0;
      const upserted = result.upsertedCount ? result.upsertedCount : 0;

      return (modified + upserted === labelIds.length);
    },

    createLabel: async (root, { id }) => {
      const labelId = id ? standardizeLabel(id) : uuid();
      const newLabel: LabelDoc = { id: labelId };
      await labels.insertOne(newLabel);

      return newLabel;
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
