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
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-label' | 'add-labels-to-item';
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

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

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

class Validation {
  static async labelExistsOrFail(labelId: string): Promise<LabelDoc | null> {
    const label: LabelDoc | null = await labels.findOne({ id: labelId });
    if (_.isNil(label)) {
      throw new Error(`Label ${labelId} not found`);
    }

    return label;
  }
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: LabelDoc | null) {
  return _.get(doc, 'pending.type') === 'create-label';
}

const resolvers = {
  Query: {
    label: async (root, { id }) => {
      const label = await Validation.labelExistsOrFail(standardizeLabel(id));
      if (_.isNil(label) || isPendingCreate(label)) {
        throw new Error(`Label ${id} not found`);
      }

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
        matchQuery['id'] = {
          $in: standardizedLabelIds,
          pending: { $exists: false }
        };
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
      const query = { pending: { $exists: false } };
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
    addLabelsToItem: async (
      root, { input }: { input: AddLabelsToItemInput }, context: Context) => {
      const labelIds = _.map(input.labelIds, standardizeLabel);

      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      const bulkUpdateBaseOps = _.map(labelIds, (labelId) => {
        return {
          updateOne: {
            filter: { id: labelId, pending: { $exists: false } },
            update: {}
          },
          upsert: true
        };
      });

      switch (context.reqType) {
        case 'vote':
          const bulkPendingUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
            const newOp = _.cloneDeep(op);
            _.set(newOp, 'updateOne.update.$set', {
              pending: {
                reqId: context.reqId,
                type: 'add-labels-to-item'
              }
            });

            return newOp;
          });

          const pendingResult = await labels.bulkWrite(bulkPendingUpdateOps);
          const pendingModified =
            pendingResult.modifiedCount ? pendingResult.modifiedCount : 0;
          const pendingUpserted =
            pendingResult.upsertedCount ? pendingResult.upsertedCount : 0;

          if (pendingModified + pendingUpserted !== labelIds.length) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case undefined:
          const bulkUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
            const newOp = _.cloneDeep(op);
            _.set(newOp, 'updateOne.update.$push', { itemIds: input.itemId });

            return newOp;
          });

          const result = await labels.bulkWrite(bulkUpdateOps);
          const modified = result.modifiedCount ? result.modifiedCount : 0;
          const upserted = result.upsertedCount ? result.upsertedCount : 0;

          if (modified + upserted !== labelIds.length) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case 'commit':
          const bulkCommitUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
            const newOp = _.cloneDeep(op);
            _.set(newOp, 'updateOne.filter', reqIdPendingFilter);
            _.set(newOp, 'updateOne.update.$unset', { pending: '' });

            return newOp;
          });

          await labels.bulkWrite(bulkCommitUpdateOps);

          return;

        case 'abort':
          const bulkAbortUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
            const newOp = _.cloneDeep(op);
            _.set(newOp, 'updateOne.filter', reqIdPendingFilter);
            _.set(newOp, 'updateOne.update', { pending: '' });

            return newOp;
          });

          await labels.bulkWrite(bulkAbortUpdateOps);

          return;
      }
    },

    createLabel: async (root, { id }, context: Context) => {
      const labelId = id ? standardizeLabel(id) : uuid();
      const newLabel: LabelDoc = { id: labelId };

      const reqIdPendingFilter = { 'pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          newLabel.pending = {
            reqId: context.reqId,
            type: 'create-label'
          };
        /* falls through */
        case undefined:
          await labels.insertOne(newLabel);

          return newLabel;
        case 'commit':
          await labels.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await labels.deleteOne(reqIdPendingFilter);

          return;
      }

      return newLabel;
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
