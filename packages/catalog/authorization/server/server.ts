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
  AddViewerToResourceInput,
  CreateResourceInput,
  PrincipalResourceInput,
  RemoveViewerFromResourceInput,
  ResourceDoc,
  ResourcesInput
} from './schema';

import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


const componentRequestTable: ComponentRequestTable = {
  'add-remove-viewer': (extraInfo) => {
    switch (extraInfo.action) {
      case 'add':
        return `
          mutation AddViewerToResource($input: AddViewerToResourceInput!) {
            addViewerToResource(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'remove':
        return `
          mutation RemoveViewerFromResource(
            $input: RemoveViewerFromResourceInput!) {
            removeViewerFromResource(input: $input)
              ${getReturnFields(extraInfo)}
          }
        `;
      case 'view':
        return `
          query CanView($input: PrincipalResourceInput!) {
            canView(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'add-viewer': (extraInfo) => `
    mutation AddViewerToResource($input: AddViewerToResourceInput!) {
      addViewerToResource(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'can-edit': (extraInfo) => `
    query CanEdit($input: PrincipalResourceInput!) {
      canEdit(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'can-view': (extraInfo) => `
    query CanView($input: PrincipalResourceInput!) {
      canView(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-resource': (extraInfo) => `
    mutation CreateResource($input: CreateResourceInput!) {
      createResource (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-resource': (extraInfo) => `
    mutation DeleteResource($id: ID!) {
      deleteResource (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'remove-viewer': (extraInfo) => `
    mutation RemoveViewerFromResource($input: RemoveViewerFromResourceInput!) {
      removeViewerFromResource(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-owner': (extraInfo) => `
    query ShowOwner($resourceId: ID!) {
      owner(resourceId: $resourceId) ${getReturnFields(extraInfo)}
    }
  `,
  'show-resource': (extraInfo) => `
    query ShowResource($id: ID!) {
      resource(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-resource-count': (extraInfo) => `
    query ShowResourceCount($input: ResourcesInput!) {
      resourceCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-resources': (extraInfo) => `
    query ShowResources($input: ResourcesInput!) {
      resources(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function getResourceFilter(input: ResourcesInput) {
  const filter = { pending: { $exists: false } };
  if (!_.isNil(input)) {
    if (input.createdBy) {
      filter['ownerId'] = input.createdBy;
    } else if (input.viewableBy) {
      filter['viewerIds'] = input.viewableBy;
    }
  }

  return filter;
}

function resolvers(db: ConceptDb, _config: Config): IResolvers {
  const resources: Collection<ResourceDoc> = db.collection('resources');

  return {
    Query: {
      resources: async (_root, { input }: { input: ResourcesInput }) => {
        const filter = {};
        if (input.createdBy) {
          filter['ownerId'] = input.createdBy;
        } else if (input.viewableBy) {
          filter['viewerIds'] = input.viewableBy;
        }

        return await resources.find(filter);
      },

      resource: async (_root, { id }) => await resources.findOne({ id }),

      resourceCount: (_root, { input }: { input: ResourcesInput }) => {
        return resources.countDocuments(getResourceFilter(input));
      },

      owner: async (_root, { resourceId }) => {
        const resource = await resources
          .findOne({ id: resourceId }, { projection: { ownerId: 1 } });

        return resource!.ownerId;
      },

      canView: async (_root, { input }: { input: PrincipalResourceInput }) => {
        const resource = await resources
          .findOne({ id: input.resourceId, viewerIds: input.principalId },
            { projection: { _id: 1 } });

        return !_.isNil(resource);
      },

      canEdit: async (_root, { input }: { input: PrincipalResourceInput }) => {
        const resource = await resources
          .findOne({ id: input.resourceId, ownerId: input.principalId },
            { projection: { _id: 1 } });

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
        _root, { input }: { input: CreateResourceInput }, context: Context) => {
        const newResource: ResourceDoc = {
          id: input.id ? input.id : uuid(),
          ownerId: input.ownerId,
          viewerIds: _.union(_.get(input, 'viewerIds', []), [input.ownerId])
        };

        return await resources.insertOne(context, newResource);
      },

      addViewerToResource: async (
        _root, { input }: { input: AddViewerToResourceInput },
        context: Context) => {
        const updateOp = { $push: { viewerIds: input.viewerId } };

        return await resources
              .updateOne(context, { id: input.id }, updateOp);
      },

      removeViewerFromResource: async (
        _root,
        { input }: { input: RemoveViewerFromResourceInput },
        context: Context) => {
        const updateOp = { $pull: { viewerIds: input.viewerId } };

        return await resources
              .updateOne(context, { id: input.id }, updateOp);
      },

      deleteResource: async (_root, { id }, context: Context) => await
        resources.deleteOne(context, { id })
    }
  };
}

const authorizationConcept: ConceptServer =
  new ConceptServerBuilder('authorization')
    .initDb((db: ConceptDb, _config: Config): Promise<any> => {
      const resources: Collection<ResourceDoc> = db.collection('resources');

      return Promise.all([
        resources.createIndex({ id: 1 }, { unique: true }),
        resources.createIndex({ id: 1, viewerIds: 1 }, { unique: true }),
        resources.createIndex({ id: 1, ownerId: 1 }, { unique: true })
      ]);
    })
    .componentRequestTable(componentRequestTable)
    .resolvers(resolvers)
    .build();

authorizationConcept.start();
