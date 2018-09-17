import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';


interface ResourceDoc {
  id: string;
  ownerId: string;
  // Includes the owner id because the owner is also a viewer
  viewerIds: string[];
}

interface ResourcesInput {
  viewableBy: string;
}

interface CreateResourceInput {
  id?: string;
  ownerId: string;
  viewerIds?: string[];
}

interface PrincipalResourceInput {
  principalId: string;
  resourceId: string;
}

interface AddViewerToResourceInput {
  id: string;
  viewerId: string;
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
let db: mongodb.Db, resources: mongodb.Collection<ResourceDoc>;
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
    resources = db.collection('resources');
    resources.createIndex({ id: 1 }, { unique: true });
    resources.createIndex({ id: 1, viewerIds: 1 }, { unique: true });
    resources.createIndex({ id: 1, ownerId: 1 }, { unique: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async resourceExists(resourceId: string): Promise<ResourceDoc> {
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

async function isOwner(principalId: string, resourceId: string) {
  const res = await resources
    .findOne({ id: resourceId, ownerId: principalId },
      { projection: { _id: 1 } });

  return !_.isNil(res);
}


const resolvers = {
  Query: {
    resources: (root, { input }: { input: ResourcesInput }) => resources
        .find({ viewerIds: input.viewableBy })
        .toArray(),

    resource: (root, { id }) => resources.findOne({ id: id }),

    owner: async (root, { resourceId }) => {
      const resource = await resources
        .findOne({ id: resourceId }, { projection: { ownerId: 1 } });

      if (!resource) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      return resource.ownerId;
    },

    isOwner: (root, { input: { principalId, resourceId } }
      : { input: PrincipalResourceInput }) => isOwner(principalId, resourceId),

    canView: async (root, { input: { principalId, resourceId } }
      : { input: PrincipalResourceInput }) => {
      const res = await resources
        .findOne({ id: resourceId, viewerIds: principalId },
          { projection: { _id: 1 } });

      return !_.isNil(res);
    },

    canEdit: (root, { input: { principalId, resourceId } }
      : { input: PrincipalResourceInput }) => isOwner(principalId, resourceId)
  },

  Resource: {
    id: (resource: ResourceDoc) => resource.id,

    ownerId: (resource: ResourceDoc) => resource.ownerId,

    viewerIds: (resource: ResourceDoc) => resource.viewerIds
  },

  Mutation: {
    createResource: async (
      root, { input }: { input: CreateResourceInput }) => {
      const newResource: ResourceDoc = {
        id: input.id ? input.id : uuid(),
        ownerId: input.ownerId,
        viewerIds: _.union(_.get(input, 'viewerIds', []), [input.ownerId])
      };

      await resources.insertOne(newResource);

      return newResource;
    },

    addViewerToResource: async (root, { input: { id, viewerId } }
      : { input: AddViewerToResourceInput }) => {
      const updateOp = { $push: { viewerIds: viewerId } };
      const update = await resources.updateOne({ id: id }, updateOp);

      return update.modifiedCount === 1;
    },

    deleteResource: async (root, { id }) => {
      const del = await resources.deleteOne({ id: id });

      return del.deletedCount === 1;
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
