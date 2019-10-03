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


function canDoQuery(action: 'view' | 'edit', throwOnError: boolean) {
  const qWrap = throwOnError ? 'VerifyCanDo' : 'CanDo';
  const q = throwOnError ? 'verifyCanDo' : 'canDo';

  return (extraInfo) => `
    query ${qWrap}($input: PrincipalResourceInput!) {
      ${q}(input: $input, action: "${action}") ${getReturnFields(extraInfo)}
    }
  `;
}

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
        return canDoQuery('view', false)(extraInfo);
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'add-viewer': (extraInfo) => `
    mutation AddViewerToResource($input: AddViewerToResourceInput!) {
      addViewerToResource(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'can-edit': canDoQuery('edit', false),
  'verify-can-edit': canDoQuery('edit', true),
  'can-view': canDoQuery('view', false),
  'verify-can-view': canDoQuery('view', true),
  'create-resource': (extraInfo) => `
    mutation CreateResource($input: CreateResourceInput!) {
      createResource(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-resource': (extraInfo) => `
    mutation DeleteResource($id: ID!) {
      deleteResource(id: $id) ${getReturnFields(extraInfo)}
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

async function canDo(
  resources, input: PrincipalResourceInput, action: 'view' | 'edit',
  throwOnError: boolean): Promise<boolean> {
  try {
    const field = action === 'view' ? 'viewerIds' : 'ownerId';
    const resource = await resources
      .findOne({ id: input.resourceId, [field]: input.principalId },
        { projection: { _id: 1 } });

    return !_.isNil(resource);
  } catch (e) {
    if (throwOnError) {
      throw new Error(
        `Principal ${input.principalId} can't ${action} ` +
        `resource ${input.resourceId}`);
    }

    return false;
  }
}

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

      canDo: async (_root, { input, action }) =>
        canDo(resources, input, action, false),

      verifyCanDo: async (_root, { input, action }) =>
        canDo(resources, input, action, true)
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

        return await resources.updateOne(context, { id: input.id }, updateOp);
      },

      removeViewerFromResource: async (
        _root, { input }: { input: RemoveViewerFromResourceInput },
        context: Context) => {
        const updateOp = { $pull: { viewerIds: input.viewerId } };

        return await resources.updateOne(context, { id: input.id }, updateOp);
      },

      deleteResource: async (_root, { id }, context: Context) =>
        await resources.deleteOne(context, { id })
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
