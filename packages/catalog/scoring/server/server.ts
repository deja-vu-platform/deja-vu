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

interface ScoreDoc {
  id: string;
  value: number;
  targetId: string;
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

const config: Config = {...DEFAULT_CONFIG, ...configArg};

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
    scores.createIndex({ targetId: 1});
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];
const totalScoreFn = new Function('scores', config.totalScoreFn);

const resolvers = {
  Query: {
    score: (_root, { id }) => scores.findOne({ id: id }),
    target: async (_root, { id }): Promise<Target> => {
      const targetScores: ScoreDoc[] = await scores.find({ targetId: id })
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
    createScore: async (_root, {input}: {input: CreateScoreInput}) => {
      const score: ScoreDoc = {
        id: input.id ? input.id : uuid(),
        value: input.value,
        targetId: input.targetId
      };
      await scores.insertOne(score);
      return score;
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
