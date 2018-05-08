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
}

interface RatingInput {
  bySourceId: string;
  ofTargetId: string;
}

interface RatingsInput {
  bySourceId?: string;
  ofTargetId?: string;
}

interface UpdateRatingInput {
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

const resolvers = {
  Query: {
    rating: async (root, { input }: { input: RatingInput }) => {
      const rating = await ratings
        .findOne({ sourceId: input.bySourceId, targetId: input.ofTargetId });

      if (_.isEmpty(rating)) {
        throw new Error(`Rating by ${input.bySourceId} for target
         ${input.ofTargetId} does not exist`);
      }

      return rating;
    },

    ratings: (root, { input }: { input: RatingsInput }) => {
      const filter = {};
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
        { $match: { targetId: targetId } },
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
    updateRating: async (root, { input }: { input: UpdateRatingInput }) => {
      const res = await ratings.updateMany(
        { sourceId: input.sourceId, targetId: input.targetId },
        { $set: { rating: input.newRating } },
        { upsert: true });

      return res.matchedCount === res.modifiedCount + res.upsertedCount;
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
