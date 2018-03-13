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
    principals = db.collection('principals');
    resources = db.collection('resources');
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async principalExists(principalId: string) {
    return Validation.exists(principals, principalId, 'Principal');
  }

  static async multiplePrincipalsAllExist(principalIds: string[]) {
    const docs = await principals.find({ id: { $in: principalIds } });

    return docs.length === principalIds.length;
  }

  static async resourceExists(resourceId: string) {
    return Validation.exists(resources, resourceId, 'Resource');
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }
}

const resolvers = {
  Query: {
    resource: (root, { id }) => resources.findOne({ id: id }),

    principal: (root, { id }) => principals.findOne({ id: id }),

    resources: () => resources.find()
      .toArray(),

    principals: () => principals.find()
      .toArray(),

    isOwner: async (root, { principalId, resourceId }) => {
      await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      const resource: ResourceDoc = await resources
        .findOne({ id: resourceId });

      return resource.ownerId === principalId;
    },

    isViewer: async (root, { principalId, resourceId }) => {
      await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      const resource: ResourceDoc = await resources
        .findOne({ id: resourceId });

      return resource.viewerIds.indexOf(principalId) > 0;
    }
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
    createPrincipal: async (root, { id }) => {
      const principalId = id ? id : uuid();
      const newPrincipal: PrincipalDoc = { id: principalId };
      await principals.insertOne(newPrincipal);

      return newPrincipal;
    },

    createResource: async (root, { id, ownerId, viewerIds }) => {
      const resourceId = id ? id : uuid();
      const viewers = viewerIds ? viewerIds : [];
      await Promise.all([
        Validation.principalExists(ownerId),
        Validation.multiplePrincipalsAllExist(viewerIds)
      ]);

      const newResource: ResourceDoc = {
        id: resourceId,
        ownerId: ownerId,
        viewerIds: viewers
      };

      await resources.insertOne(newResource);

      return newResource;
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
