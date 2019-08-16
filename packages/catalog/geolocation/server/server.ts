import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/concept-server';
import {
  CreateMarkerInput,
  MarkerDoc,
  MarkersInput
} from './schema';

import { IResolvers } from 'graphql-tools';
import { v4 as uuid } from 'uuid';


const componentRequestTable: ComponentRequestTable = {
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
  'create-marker-from-map': (extraInfo) => `
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
  `,
  'show-marker-count': (extraInfo) => `
    query ShowMarkerCount($input: MarkersInput!) {
      markerCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function milesToRadian(miles: number) {
  const earthRadiusInMiles = 3963.2;

  return miles / earthRadiusInMiles;
}

function resolvers(db: ConceptDb, _config: Config): IResolvers {
  const markers: Collection<MarkerDoc> = db.collection('markers');

  return {
    Query: {
      marker: async (_root, { id }) => await markers.findOne({ id }),

      markers: async (_root, { input }: { input: MarkersInput }) => {
        const filter = {};
        if (input.ofMapId) {
          // Get markers by map
          filter['mapId'] = input.ofMapId;
        }

        if (input.centerLat && input.centerLng && input.radius) {
          // Get markers within a given radius (in miles)
          filter['location'] = {
            $geoWithin: {
              $centerSphere: [
                [input.centerLng, input.centerLat],
                milesToRadian(input.radius)
              ]
            }
          };
        }

        return await markers.find(filter);
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

        return await markers.insertOne(context, newMarker);
      },

      deleteMarker: async (_root, { id }, context: Context) =>
        await markers.deleteOne(context, { id })
    }
  };
}

const geolocationConcept: ConceptServer =
  new ConceptServerBuilder('geolocation')
    .initDb((db: ConceptDb, _config: Config): Promise<any> => {
      const markers: Collection<MarkerDoc> = db.collection('markers');

      return Promise.all([
        markers.createIndex({ id: 1 }, { unique: true, sparse: true }),
        markers.createIndex({ id: 1, mapId: 1, location: '2dsphere' },
          { unique: true, sparse: true })
      ]);
    })
    .componentRequestTable(componentRequestTable)
    .resolvers(resolvers)
    .build();

geolocationConcept.start();
