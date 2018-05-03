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
  label: async (root, { id }) => {
    const label = await labels.findOne({ id: standardizeLabel(id) });
    if (_.isEmpty(label)) { throw new Error(`Label ${id} not found`); }

    return label;
  },

  items: async (root, { input }: { input: ItemsInput }) => {
    if (input.labelIds) {
      // Items matching all labelIds
      const standarardizedLabelIds = _.map(input.labelIds, standardizeLabel);
      const inputLabels =
        await labels.find({ id: { $in: standarardizedLabelIds } },
          { projection: { _id: 1 } })
          .toArray();

      if (inputLabels.length !== input.labelIds.length) {
        throw new Error(`One of the labels does not exist.`);
      }

      const res = await labels.aggregate([
        { $match: { id: { $in: standarardizedLabelIds } } },
        {
          $group: {
            _id: 0,
            itemIds: { $push: '$itemIds' }
          }
        },
        {
          $project: {
            itemIds: {
              $reduce: {
                input: '$itemIds',
                initialValue: [],
                in: { $setIntersection: ['$$value', '$$this'] }
              }
            }
          }
        }
      ])
        .toArray();

      return res[0].itemIds;
    }

    // No item filter
    const results = await labels.aggregate([
      { $match: {} },
      {
        $group: {
          _id: 0,
          itemIds: { $push: '$itemIds' }
        }
      },
      {
        $project: {
          itemIds: {
            $reduce: {
              input: '$itemIds',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      }
    ])
      .toArray();

    return results[0].itemIds;
  },

  labels: async (root, { input }: { input: LabelsInput }) => {
    if (input.itemId) {
      // Labels of an item
      return labels.find({ itemIds: input.itemId })
        .toArray();
    }

    // No labels filter
    return labels.find()
      .toArray();
  },

  Label: {
    id: (label: LabelDoc) => label.id,
    items: (label: LabelDoc) => label.itemIds
  },

  Mutation: {
    addLabelsToItem: async (root, { input }: { input: AddLabelsToItemInput }) =>
    // tslint:disable-next-line:one-line
    {
      let status;

      const labelIds = _.map(input.labelIds, standardizeLabel);

      // Find existing labels
      const existingLabels: LabelDoc[] = await labels
        .find({ id: { $in: labelIds } }, { projection: { id: 1 } })
        .toArray();
      const existingLabelIds = _.map(existingLabels, 'id');

      // Determine the new labels and add them
      const newLabelIds = _.difference(existingLabelIds, labelIds);
      if (!_.isEmpty(newLabelIds)) {
        const newLabels: LabelDoc[] =
          _.map(newLabelIds, (id) => ({ id: id, itemIds: [input.itemId] }));
        const insertRes = await labels.insert(newLabels);
        status = insertRes.insertedCount !== newLabelIds.length;
      }

      // Update other labels with the itemId
      const updateOperation = {
        $addToSet: { itemIds: input.itemId }
      };

      const res = await labels
        .update({ id: { $in: existingLabelIds } }, updateOperation);

      return status && (res.result.nModified === existingLabelIds.length);
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
