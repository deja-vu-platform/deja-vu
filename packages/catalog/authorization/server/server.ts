import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';


interface ResourceDoc {
  id: string;
  ownerId: string;
  // Includes the owner id because the owner is also a viewer
  viewerIds: string[];
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-resource' | 'add-viewer-to-resource' | 'delete-resource';
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

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

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
  static async resourceExistsOrFail(resourceId: string): Promise<ResourceDoc> {
    const resource: ResourceDoc | null = await resources
      .findOne({ id: resourceId });
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    return resource;
  }
}

async function isOwner(principalId: string, resourceId: string) {
  const res = await resources
    .findOne({ id: resourceId, ownerId: principalId },
      { projection: { _id: 1 } });

  return !_.isNil(res);
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: ResourceDoc | null) {
  return _.get(doc, 'pending.type') === 'create-resource';
}

const resolvers = {
  Query: {
    resources: (root, { input }: { input: ResourcesInput }) => resources
      .find({ viewerIds: input.viewableBy, pending: { $exists: false } })
      .toArray(),

    resource: async (root, { id }) => {
      const resource: ResourceDoc | null = await Validation
        .resourceExistsOrFail(id);
      if (_.isNil(resource) || isPendingCreate(resource)) {
        throw new Error(`Resource ${id} not found`);
      }

      return resource;
    },

    owner: async (root, { resourceId }) => {
      const resource = await resources
        .findOne({ id: resourceId }, { projection: { ownerId: 1 } });

      if (_.isNil(resource) || isPendingCreate(resource)) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      return resource!.ownerId;
    },

    canView: async (root, { input }: { input: PrincipalResourceInput }) => {
      const resource = await resources
        .findOne({ id: input.resourceId, viewerIds: input.principalId },
          { projection: { _id: 1 } });

      if (isPendingCreate(resource)) {
        return null;
      }

      return !_.isNil(resource);
    },

    canEdit: async (root, { input }: { input: PrincipalResourceInput }) => {
      const resource = await resources
        .findOne({ id: input.resourceId, ownerId: input.principalId },
          { projection: { _id: 1 } });

      if (isPendingCreate(resource)) {
        return null;
      }

      return !_.isNil(resource);
    }
  },

  Resource: {
    id: (resource: ResourceDoc) => resource.id,

    ownerId: (resource: ResourceDoc) => resource.ownerId,

    viewerIds: (resource: ResourceDoc) => resource.viewerIds
  },

  Mutation: {
    createResource: async (
      root, { input }: { input: CreateResourceInput }, context: Context) => {
      const newResource: ResourceDoc = {
        id: input.id ? input.id : uuid(),
        ownerId: input.ownerId,
        viewerIds: _.union(_.get(input, 'viewerIds', []), [input.ownerId])
      };

      const reqIdPendingFilter = { 'pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          newResource.pending = {
            reqId: context.reqId,
            type: 'create-resource'
          };
        /* falls through */
        case undefined:
          await resources.insertOne(newResource);

          return newResource;
        case 'commit':
          await resources.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await resources.deleteOne(reqIdPendingFilter);

          return;
      }

      return newResource;
    },

    addViewerToResource: async (
      root,
      { input }: { input: AddViewerToResourceInput }, context: Context) => {
      const updateOp = { $push: { viewerIds: input.viewerId } };
      const notPendingResourceFilter = {
        id: input.id,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          await Validation.resourceExistsOrFail(input.id);
          const pendingUpdateObj = await resources
            .updateOne(
              notPendingResourceFilter,
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'add-viewer-to-resource'
                  }
                }
              });
          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case undefined:
          await Validation.resourceExistsOrFail(input.id);
          const updateObj = await resources
            .updateOne(notPendingResourceFilter, updateOp);
          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case 'commit':
          await resources.updateOne(
            reqIdPendingFilter,
            { ...updateOp, $unset: { pending: '' } });

          return;
        case 'abort':
          await resources.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return;
      }
    },

    deleteResource: async (root, { id }, context: Context) => {
      const notPendingResourceFilter = {
        id: id,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          await Validation.resourceExistsOrFail(id);
          const pendingUpdateObj = await resources.updateOne(
            notPendingResourceFilter,
            {
              $set: {
                pending: {
                  reqId: context.reqId,
                  type: 'delete-resource'
                }
              }
            });

          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case undefined:
          await Validation.resourceExistsOrFail(id);
          const res = await resources
            .deleteOne({ id: id, pending: { $exists: false } });

          if (res.deletedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case 'commit':
          await resources.deleteOne(reqIdPendingFilter);

          return;
        case 'abort':
          await resources.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return;
      }

      return;
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.get(/^\/dv\/(.*)\/vote\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: 'vote',
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        return {
          result: (gqlResp.errors) ? 'no' : 'yes',
          payload: gqlResp
        };
      }
    };
  })
);

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
