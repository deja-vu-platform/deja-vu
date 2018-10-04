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

interface MarkerDoc {
  id: string;
  title?: string;
  location: {
    type: string,                   // 'Point'
    coordinates: [number, number]   // [longitude, latitude]
  };
  mapId: string;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-marker' | 'delete-marker';
}

interface Marker {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  mapId: string;
}

interface CreateMarkerInput {
  id?: string;
  title?: string;
  latitude: number;
  longitude: number;
  mapId: string;
}

interface MarkersInput {
  ofMapId?: string;
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

const name = argv.as ? argv.as : 'geolocation';

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
let markers: mongodb.Collection<MarkerDoc>;
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
    markers = db.collection('markers');
    markers.createIndex({ id: 1 }, { unique: true, sparse: true });
    markers.createIndex({ id: 1, mapId: 1, location: '2dsphere' },
      { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async markerExistsOrFail(id: string): Promise<MarkerDoc> {
    const marker: MarkerDoc | null = await markers
      .findOne({ id: id });
    if (!marker) {
      throw new Error(`Marker ${id} doesn't exist `);
    }

    return marker;
  }
}

function markerDocToMarker(markerDoc: MarkerDoc): Marker {
  const ret = _.omit(markerDoc, ['location']);
  ret.longitude = markerDoc.location.coordinates[0];
  ret.latitude = markerDoc.location.coordinates[1];

  return ret;
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: MarkerDoc | null) {
  return _.get(doc, 'pending.type') === 'create-marker';
}

const resolvers = {
  Query: {
    marker: async (root, { id }) => {
      const marker = await Validation.markerExistsOrFail(id);
      if (_.isNil(marker) || isPendingCreate(marker)) {
        throw new Error(`Marker ${id} does not exist`);
      }

      return markerDocToMarker(marker);
    },

    markers: (root, { input }: { input: MarkersInput }) => {
      const filter = { pending: { $exists: false } };
      if (input.ofMapId) {
        // Get markers by map
        filter['mapId'] = input.ofMapId;

        return markers.find(filter)
          .toArray();
      } else {
        // Get all markers
        return markers.find(filter)
          .toArray();
      }
    }
  },

  Marker: {
    id: (marker: MarkerDoc) => marker.id,
    title: (marker: MarkerDoc) => marker.title,
    latitude: (marker: MarkerDoc) => marker.location.coordinates[1],
    longitude: (marker: MarkerDoc) => marker.location.coordinates[0],
    mapId: (marker: MarkerDoc) => marker.mapId
  },

  Mutation: {
    createMarker: async (
      root, { input }: { input: CreateMarkerInput }, context: Context) => {
      const newMarker: MarkerDoc = {
        id: input.id ? input.id : uuid(),
        title: input.title ? input.title : '',
        location: {
          type: 'Point',
          coordinates: [input.longitude, input.latitude]
        },
        mapId: input.mapId
      };

      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          newMarker.pending = {
            reqId: context.reqId,
            type: 'create-marker'
          };
        /* falls through */
        case undefined:
          await markers.insertOne(newMarker);

          return newMarker;
        case 'commit':
          await markers.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await markers.deleteOne(reqIdPendingFilter);

          return;
      }

      return newMarker;
    },

    deleteMarker: async (root, { id }, context: Context) => {
      const notPendingResourceFilter = {
        id: id,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          await Validation.markerExistsOrFail(id);
          const pendingUpdateObj = await markers.updateOne(
            notPendingResourceFilter,
            {
              $set: {
                pending: {
                  reqId: context.reqId,
                  type: 'delete-marker'
                }
              }
            });

          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case undefined:
          await Validation.markerExistsOrFail(id);
          const res = await markers
            .deleteOne({ id: id, pending: { $exists: false } });

          if (res.deletedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case 'commit':
          await markers.deleteOne(reqIdPendingFilter);

          return;
        case 'abort':
          await markers.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return;
      }

      return;

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
