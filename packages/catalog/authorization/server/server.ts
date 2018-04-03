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

interface PrincipalDoc {
  id: string;
}

interface ResourceDoc {
  id: string;
  ownerId: string;
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
  static async principalExists(principalId: string): Promise<PrincipalDoc> {
    return Validation.exists(principals, principalId, 'Principal');
  }

  static async multiplePrincipalsAllExist(principalIds: string[]) {
    const numExistingPrincipals = await principals
      .count({ id: { $in: principalIds } });

    return numExistingPrincipals === principalIds.length;
  }

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

const resolvers = {
  Query: {
    resources: (root, { input }: { input: ResourcesInput }) => {
      let filter = {};
      if (!_.isEmpty(input.viewableBy)) {
        filter = {
          $or: [{viewerIds: input.viewableBy}, {ownerId: input.viewableBy}]
        };
      }

      return resources.find(filter)
        .toArray();
    },

    principals: () => principals.find()
      .toArray(),

    resource: (root, { id }) => resources.findOne({ id: id }),

    principal: (root, { id }) => principals.findOne({ id: id }),

    owner: async (root, { resourceId }) => {
      const resource = await resources
        .findOne({ id: resourceId }, { ownerId: 1 });

      return principals.findOne({ id: resource.ownerId });
    },

    isOwner: async (root, { principalId, resourceId }) => {
      const [unusedPrincipal, resource] = await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      return resource.ownerId === principalId;
    },

    isViewer: async (root, { principalId, resourceId }) => {
      const [unusedPrincipal, resource] = await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      return _.include(resource.viewerIds, principalId);
    },

    canView: async (root, { principalId, resourceId }) => {
      const [unusedPrincipal, resource] = await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      return resource.ownerId === principalId ||
        _.includes(resource.viewerIds, principalId);
    },

    canEdit: async (root, { principalId, resourceId }) => {
      const [unusedPrincipal, resource] = await Promise.all([
        Validation.principalExists(principalId),
        Validation.resourceExists(resourceId)
      ]);

      return resource.ownerId === principalId;
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

    createResource: async (
      root, { input }: { input: CreateResourceInput }) => {
      const resourceId = input.id ? input.id : uuid();
      const viewers = !_.isEmpty(input.viewerIds) ? input.viewerIds! : [];
      await Promise.all([
        Validation.principalExists(input.ownerId),
        Validation.multiplePrincipalsAllExist(viewers)
      ]);

      const newResource: ResourceDoc = {
        id: resourceId,
        ownerId: input.ownerId,
        viewerIds: viewers
      };

      await resources.insertOne(newResource);

      return newResource;
    },

    addViewerToResource: async (root, { id, viewerId }) => {
      const [unusedPrincipal, resource] = await Promise.all([
        Validation.principalExists(viewerId),
        Validation.resourceExists(id)
      ]);

      const newViewerIds = resource.viewerIds;
      newViewerIds.push(viewerId);

      const updateOp = {
        $set: { viewerIds: newViewerIds }
      };
      await resources.updateOne({ id: id }, updateOp);

      return true;
    },

    deleteResource: async (root, { id }) => {
      await resources.deleteOne({ id: id });

      return { id: id };
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
