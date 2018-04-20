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

// TODO: Allow editting labels for an object?

interface ItemDoc {
  id: string;
  labelIds?: string[];
}

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

let db, items, labels;
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

    items = db.collection('items');
    items.createIndex({ id: 1 }, { unique: true, sparse: true });
    labels = db.collection('labels');
    labels.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async itemExists(id: string): Promise<ItemDoc> {
    return Validation.exists(items, id, 'Item');
  }

  static async labelExists(id: string): Promise<LabelDoc> {
    return Validation.exists(labels, standardizeLabel(id), 'Label');
  }

  static labelsExist(ids: string[]): Promise<LabelDoc[]> {
    const standarardizedLabelIds = _.map(ids, standardizeLabel);

    return Validation.multipleExist(labels, standarardizedLabelIds);
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }

  static async multipleExist(collection, ids: string[]) {
    const documents = await collection
      .find({ id: { $in: ids } })
      .toArray();

    if (documents.length !== ids.length) {
      return [];
    }

    return documents;
  }
}

function standardizeLabel(id: string): string {
  return id.trim()
    .toLowerCase();
}

const resolvers = {
  Query: {
    item: async (root, { id }) => {
      const item = await Validation.itemExists(id);

      return item;
    },

    label: async (root, { id }) => {
      const label = await Validation.labelExists(id);

      return label;
    },

    items: async (root, { input }: { input: ItemsInput }) => {
      if (input.labelIds) {
        const inputLabels = await Validation.labelsExist(input.labelIds);

        if (inputLabels.length !== input.labelIds.length) {
          return [];
        }

        const labelItemsIds = _.map(inputLabels, 'itemIds');
        const commonItemIds = _.intersection(labelItemsIds);

        return items.find({ id: { $in: commonItemIds } })
          .toArray();
      }

      // No label filter
      return items.find()
        .toArray();
    },

    labels: async (root, { input }: { input: LabelsInput }) => {
      if (input.itemId) {
        const item = await Validation.itemExists(input.itemId);

        return labels.find({ id: { $in: item.labelIds } })
          .toArray();
      }

      return labels.find()
        .toArray();
    }
  },

  Item: {
    id: (item: ItemDoc) => item.id,
    labels: (item: ItemDoc) => {
      if (_.isEmpty(item.labelIds)) { return []; }

      return labels
        .find({ id: { $in: item.labelIds } })
        .toArray();
    }
  },

  Label: {
    id: (label: LabelDoc) => label.id,
    items: (label: LabelDoc) => {
      if (_.isEmpty(label.itemIds)) { return []; }

      return items
        .find({ id: { $in: label.itemIds } })
        .toArray();
    }
  },

  Mutation: {
    addLabelsToItem: async (root, { input }: { input: AddLabelsToItemInput }) =>
    // tslint:disable-next-line:one-line
    {
      await Validation.itemExists(input.itemId);

      const labelIds = _.map(input.labelIds, standardizeLabel);

      // Find existing labels
      const existingLabels: LabelDoc[] = await labels
        .find({ id: { $in: labelIds } })
        .toArray();
      const existingLabelIds = _.map(existingLabels, 'id');

      // Determine the new labels and add them
      const newLabelIds = _.difference(existingLabelIds, labelIds);
      const newLabels: LabelDoc[] = _.map(newLabelIds, (id) => ({ id: id }));

      if (!_.isEmpty(newLabels)) {
        await labels.insert(newLabels);
      }

      // Update the item with all labels it doesn't already have
      const updateOperation = {
        $addToSet: { labelIds: { $each: labelIds } }
      };

      const res = await items
        .findOneAndUpdate({ id: input.itemId }, updateOperation);

      return res.value;
    },

    createItem: async (root, { id }) => {
      const itemId = id ? id : uuid();
      const newItem: ItemDoc = { id: itemId };
      await items.insertOne(newItem);

      return newItem;
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
