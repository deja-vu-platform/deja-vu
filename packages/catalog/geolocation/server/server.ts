import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

interface MarkerDoc {
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
  mapId?: string;
  minLat?: number;
  maxLat?: number;
  minLong?: number;
  maxLong?: number;
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
    markers.createIndex({ id: 1, mapId: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];


const resolvers = {
  Query: {
    marker: (root, { id }) => markers.findOne({ id: id }),

    markers: (root, { input }: { input: MarkersInput }) => {
      if (input.mapId) {
        // Get markers by map
        return markers.find({ mapId: input.mapId })
          .toArray();
      } else if (input.maxLat && input.maxLong
        && input.minLat && input.minLong) {
        // Get markers for a defined area
        return markers.find({
          $and: [
            { latitude: { $gt: input.minLat, $lt: input.maxLat } },
            { longitude: { $gt: input.minLong, $lt: input.maxLong } }
          ]
        })
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
    latitude: (marker: MarkerDoc) => marker.latitude,
    longitude: (marker: MarkerDoc) => marker.longitude,
    mapId: (marker: MarkerDoc) => marker.mapId
  },

  Mutation: {
    createMarker: async (root, { input }: { input: CreateMarkerInput }) => {
      const marker: MarkerDoc = {
        id: input.id ? input.id : uuid(),
        title: input.title ? input.title : '',
        latitude: input.latitude,
        longitude: input.longitude,
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
