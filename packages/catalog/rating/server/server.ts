import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';

import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

interface RatingDoc {
  sourceId: string;
  targetId: string;
  rating: number;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'set-rating';
}

interface RatingInput {
  bySourceId: string;
  ofTargetId: string;
}

interface RatingsInput {
  bySourceId?: string;
  ofTargetId?: string;
}

interface SetRatingInput {
  sourceId: string;
  targetId: string;
  newRating?: number;
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

const name = argv.as ? argv.as : 'rating';

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
let ratings: mongodb.Collection<RatingDoc>;
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
    ratings = db.collection('ratings');
    ratings.createIndex(
      { sourceId: 1, targetId: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingUpdate(doc: RatingDoc | null) {
  return _.get(doc, 'pending.type') === 'update-rating';
}

const resolvers = {
  Query: {
    rating: async (root, { input }: { input: RatingInput }) => {
      const rating = await ratings
        .findOne({ sourceId: input.bySourceId, targetId: input.ofTargetId });

      if (_.isNil(rating) || isPendingUpdate(rating)) {
        throw new Error(`Rating by ${input.bySourceId} for target
         ${input.ofTargetId} does not exist`);
      }

      return rating;
    },

    ratings: (root, { input }: { input: RatingsInput }) => {
      const filter = { pending: { $exists: false } };
      if (input.bySourceId) {
        // All ratings by a source
        filter['sourceId'] = input.bySourceId;
      }

      if (input.ofTargetId) {
        // All ratings of a target
        filter['targetId'] = input.ofTargetId;
      }

      return ratings.find(filter)
        .toArray();
    },

    averageRatingForTarget: async (root, { targetId }) => {
      const results = await ratings.aggregate([
        // Ignore ratings that are currently being updated
        { $match: { targetId: targetId, pending: { $exists: false } } },
        {
          $group:
          {
            _id: 0,
            average: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ])
        .toArray();

      if (_.isEmpty(results)) { throw new Error(`Target does not exist`); }

      return {
        rating: results[0]['average'],
        count: results[0]['count']
      };
    }
  },

  Rating: {
    sourceId: (rating: RatingDoc) => rating.sourceId,
    targetId: (rating: RatingDoc) => rating.targetId,
    rating: (rating: RatingDoc) => rating.rating
  },

  Mutation: {
    setRating: async (
      root, { input }: { input: SetRatingInput }, context: Context) => {
      const notPendingRatingFilter = {
        sourceId: input.sourceId,
        targetId: input.targetId,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          const pendingUpdateObj = await ratings.updateMany(
            notPendingRatingFilter,
            {
              $set: {
                pending: {
                  reqId: context.reqId,
                  type: 'set-rating'
                }
              }
            },
            { upsert: true }
          );

          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case undefined:
          const updateObj = await ratings.updateMany(
            notPendingRatingFilter,
            { $set: { rating: input.newRating } },
            { upsert: true });
          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case 'commit':
          await ratings.updateMany(
            reqIdPendingFilter,
            {
              $set: { rating: input.newRating },
              $unset: { pending: '' }
            },
            { upsert: true }
          );

          return false;

        case 'abort':
          await ratings.updateMany(
            reqIdPendingFilter,
            { $unset: { pending: '' } },
            { upsert: true }
          );

          return false;
      }

      return false;
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
