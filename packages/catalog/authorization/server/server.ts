import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

interface PrincipalDoc {
  id: string;
}

interface ResourceDoc {
  id: string;
  ownerId: string;
  viewerIds: string[];
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'authorization';

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
let db, principals, resources;
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
    principals = db.collection('sources');
    resources = db.collection('resources');
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

const resolvers = {
  Query: {
    principals: () => principals.find()
      .toArray(),
    resources: () => resources.find()
      .toArray(),
    principal: (root, { id }) => principals.findOne({ id: id }),
    resource: (root, { id }) => resources.findOne({ id: id })
  },
  Principal: {
    id: (principal: PrincipalDoc) => principal.id
  },
  Resource: {
    id: (resource: ResourceDoc) => resource.id,
    owner: (resource: ResourceDoc) => principals
      .findOne({ id: resource.ownerId }),
    viewers: (resource: ResourceDoc) => principals
      .find({ id: { $in: resource.viewerIds } })
      .toArray()
  },
  Mutation: {
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
