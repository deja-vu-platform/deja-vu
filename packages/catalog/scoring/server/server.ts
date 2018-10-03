import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

interface ScoreDoc {
  id: string;
  value: number;
  targetId: string;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-score';
}

interface Target {
  id: string;
  scores: ScoreDoc[];
  total?: number; // optional to allow lazy computation
}

interface CreateScoreInput {
  id: string;
  value: number;
  targetId: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  // Function body that calculates the total score
  // based on the parameter scores which is an array of scores with type number
  totalScoreFn: string;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'scoring';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
  totalScoreFn: `return scores.reduce((total, score) => total + score, 0);`
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = { ...DEFAULT_CONFIG, ...configArg };

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db, scores: mongodb.Collection<ScoreDoc>;
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
    scores = db.collection('scores');
    scores.createIndex({ id: 1 }, { unique: true, sparse: true });
    scores.createIndex({ targetId: 1 });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];
const totalScoreFn = new Function('scores', config.totalScoreFn);

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: ScoreDoc | null) {
  return _.get(doc, 'pending.type') === 'create-score';
}

const resolvers = {
  Query: {
    score: async (_root, { id }) => {
      const score = await scores.findOne({
        id: id, pending: { $exists: false }
      });

      if (_.isNil(score) || isPendingCreate(score)) {
        throw new Error(`Score ${id} not found`);
      }

      return score;
    },
    target: async (_root, { id }): Promise<Target> => {
      const targetScores: ScoreDoc[] = await scores.find({
        targetId: id, pending: { $exists: false }
      })
        .toArray();

      return {
        id: id,
        scores: targetScores
      };
    }
  },
  Score: {
    id: (score: ScoreDoc) => score.id,
    value: (score: ScoreDoc) => score.value,
    targetId: (score: ScoreDoc) => score.targetId
  },
  Target: {
    id: (target: Target) => target.id,
    scores: (target: Target) => target.scores,
    total: (target: Target) => totalScoreFn(_.map(target.scores, 'value'))
  },
  Mutation: {
    createScore: async (
      _root, { input }: { input: CreateScoreInput }, context: Context) => {
      const newScore: ScoreDoc = {
        id: input.id ? input.id : uuid(),
        value: input.value,
        targetId: input.targetId
      };

      const reqIdPendingFilter = { 'pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          newScore.pending = {
            reqId: context.reqId,
            type: 'create-score'
          };
        /* falls through */
        case undefined:
          await scores.insertOne(newScore);

          return newScore;
        case 'commit':
          await scores.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await scores.deleteOne(reqIdPendingFilter);

          return;
      }

      return newScore;
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
