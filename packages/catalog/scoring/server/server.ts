import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

interface ScoreDoc {
  id: string;
  value: number;
}

interface TargetDoc {
  id: string;
  scores: string[];
}

interface Score {
  id: string;
  value: number;
}

interface Target {
  id: string;
  scores: Score[];
  total: number;
}

interface CreateScoreInput {
  id: string;
  value: number;
}

interface CreateTargetInput {
  id: string;
  initialScore: CreateScoreInput;
}

interface UpdateTargetInput {
  id: string;
  addScore: CreateScoreInput;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  // Function body that calculates the total score
  // based on the parameter scores which is an array of Score objects
  aggregateFn: string;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'scoring';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
  aggregateFn: `return scores.reduce((total, score) => total + score.value, 0);`
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db, scores, targets, aggregateFn;
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
    targets = db.collection('targets');
    targets.createIndex({ id: 1 }, { unique: true, sparse: true });
    aggregateFn = new Function('scores', config.aggregateFn);
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async scoreExists(id: string): Promise<ScoreDoc> {
    return Validation.exists(scores, id, 'Score');
  }

  static async targetExists(id: string): Promise<TargetDoc> {
    return Validation.exists(targets, id, 'Target');
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }
    return doc;
  }
}

async function targetDocToTarget(targetDoc: TargetDoc): Promise<Target> {
  const targetScores: Score[] = await Promise.all(targetDoc.scores.map(
    (scoreId: string) => scores.findOne({ id: scoreId })));
  const total: number = aggregateFn(targetScores);
  return {
    id: targetDoc.id,
    scores: targetScores,
    total: total
  };
}

async function createScore(input: CreateScoreInput): Promise<ScoreDoc> {
  const score: ScoreDoc = {
    id: input.id ? input.id : uuid(),
    value: input.value
  };
  await scores.insertOne(score);

  return score;
}


const resolvers = {
  Query: {
    score: (_root, { id }) => scores.findOne({ id: id }),
    target: async (_root, { id }) => {
      const targetDoc = await Validation.targetExists(id);
      return targetDocToTarget(targetDoc);
    }
  },
  Score: {
    id: (score: ScoreDoc) => score.id,
    value: (score: ScoreDoc) => score.value
  },
  Target: {
    id: (target: TargetDoc) => target.id,
    scores: async (target: TargetDoc) => target.scores
  },
  Mutation: {
    createScore: async (_root, {input}: {input: CreateScoreInput}) => {
      return createScore(input);
    },
    createTarget: async (_root, {input}: {input: CreateTargetInput}) => {
      const targetId = input.id ? input.id : uuid();
      const target: TargetDoc = { id: targetId, scores: []};
      if (input.initialScore) {
        const initialScore: ScoreDoc = await createScore(input.initialScore);
        target.scores = [initialScore.id];
      }
      await targets.insertOne(target);

      return targetDocToTarget(target);
    },
    updateTarget: async (_root, {input}: {input: UpdateTargetInput}) => {
      await Validation.targetExists(input.id);
      const newScore: ScoreDoc = await createScore(input.addScore);

      const updateOp = { $push: { scores: newScore.id } };
      await targets.updateOne({ id: input.id }, updateOp);

      return true;
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
