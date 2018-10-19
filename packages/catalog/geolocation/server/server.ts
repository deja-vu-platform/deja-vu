import {
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  Validation
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  CreateMarkerInput,
  Marker,
  MarkerDoc,
  MarkersInput,
  PendingDoc
} from './schema';
import { v4 as uuid } from 'uuid';


class MarkerValidation {
  static async markerExistsOrFail(
    markers: mongodb.Collection<MarkerDoc>, id: string): Promise<MarkerDoc> {
    return Validation.existsOrFail(markers, id, 'Marker');
  }
}

function markerDocToMarker(markerDoc: MarkerDoc): Marker {
  const ret = _.omit(markerDoc, ['location']);
  ret.longitude = markerDoc.location.coordinates[0];
  ret.latitude = markerDoc.location.coordinates[1];

  return ret;
}

function isPendingCreate(doc: MarkerDoc | null) {
  return _.get(doc, 'pending.type') === 'create-marker';
}

function resolvers(db: mongodb.Db, config: Config): object {
  const markers: mongodb.Collection<MarkerDoc> = db.collection('markers');
  return {
  Query: {
    marker: async (root, { id }) => {
      const marker = await MarkerValidation.markerExistsOrFail(markers, id);
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
          await MarkerValidation.markerExistsOrFail(markers, id);
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
          await MarkerValidation.markerExistsOrFail(markers, id);
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

const geolocationCliche: ClicheServer = new ClicheServerBuilder('geolocation')
  .initDb((db: mongodb.Db, config: Config): Promise<any> => {
    const markers: mongodb.Collection<MarkerDoc> = db.collection('markers');
    return Promise.all([
      markers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      markers.createIndex({ id: 1, mapId: 1, location: '2dsphere' },
        { unique: true, sparse: true })
    ]);
  })
  .resolvers(resolvers)
  .build();

geolocationCliche.start();
