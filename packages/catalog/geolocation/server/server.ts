import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import {
  CreateMarkerInput,
  MarkerDoc,
  MarkersInput
} from './schema';

import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';


class MarkerValidation {
  static async markerExistsOrFail(
    markers: mongodb.Collection<MarkerDoc>, id: string): Promise<MarkerDoc> {
    return Validation.existsOrFail(markers, id, 'Marker');
  }
}

const actionRequestTable: ActionRequestTable = {
  'show-marker': (extraInfo) => `
    query ShowMarker($id: ID!) {
      marker(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'create-marker': (extraInfo) => `
    mutation CreateMarker($input: CreateMarkerInput!) {
      createMarker (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-marker': (extraInfo) => `
    mutation DeleteMarker($id: ID!) {
      deleteMarker (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'display-map': (extraInfo) => `
    query DisplayMap($input: MarkersInput!) {
      markers(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-markers': (extraInfo) => `
    query ShowMarkers($input: MarkersInput!) {
      markers(input: $input) ${getReturnFields(extraInfo)}
    }
  `
}

function isPendingCreate(doc: MarkerDoc | null) {
  return _.get(doc, 'pending.type') === 'create-marker';
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const markers: mongodb.Collection<MarkerDoc> = db.collection('markers');

  return {
    Query: {
      marker: async (_root, { id }) => {
        const marker = await MarkerValidation.markerExistsOrFail(markers, id);
        if (_.isNil(marker) || isPendingCreate(marker)) {
          throw new Error(`Marker ${id} does not exist`);
        }

        return marker;
      },

      markers: (_root, { input }: { input: MarkersInput }) => {
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
        _root, { input }: { input: CreateMarkerInput }, context: Context) => {
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

            return newMarker;
          case 'abort':
            await markers.deleteOne(reqIdPendingFilter);

            return newMarker;
        }

        return newMarker;
      },

      deleteMarker: async (_root, { id }, context: Context) => {
        const notPendingMarkerIdFilter = {
          id: id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await MarkerValidation.markerExistsOrFail(markers, id);
            const pendingUpdateObj = await markers.updateOne(
              notPendingMarkerIdFilter,
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
              .deleteOne(notPendingMarkerIdFilter);

            if (res.deletedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await markers.deleteOne(reqIdPendingFilter);

            return true;
          case 'abort':
            await markers.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return true;
        }

        return true;
      }
    }
  };
}

const geolocationCliche: ClicheServer = new ClicheServerBuilder('geolocation')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const markers: mongodb.Collection<MarkerDoc> = db.collection('markers');

    return Promise.all([
      markers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      markers.createIndex({ id: 1, mapId: 1, location: '2dsphere' },
        { unique: true, sparse: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

geolocationCliche.start();
