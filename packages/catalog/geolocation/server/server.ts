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

function markerDocToMarker(markerDoc: MarkerDoc): Marker {
  const ret = _.omit(markerDoc, ['location']);
  ret.longitude = markerDoc.location.coordinates[0];
  ret.latitude = markerDoc.location.coordinates[1];

  return ret;
}

const resolvers = {
  Query: {
    marker: async (root, { id }) => {
      const marker = await markers.findOne({ id: id });
      if (!marker) {
        throw new Error(`Marker ${id} does not exist`);
      }

      return markerDocToMarker(marker);
    },

    markers: (root, { input }: { input: MarkersInput }) => {
      if (input.ofMapId) {
        // Get markers by map
        return markers.find({ mapId: input.ofMapId })
          .toArray();
      } else {
        // Get all markers
        return markers.find()
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
    createMarker: async (root, { input }: { input: CreateMarkerInput }) => {
      const marker: MarkerDoc = {
        id: input.id ? input.id : uuid(),
        title: input.title ? input.title : '',
        location: {
          type: 'Point',
          coordinates: [input.longitude, input.latitude]
        },
        mapId: input.mapId
      };

      await markers.insertOne(marker);

      return marker;
    },

    deleteMarker: async (root, { id }) => {
      const res = await markers.deleteOne({ id: id });

      return res.deletedCount === 1;
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
