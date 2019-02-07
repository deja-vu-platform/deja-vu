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
  AddViewerToResourceInput,
  CreateResourceInput,
  PrincipalResourceInput,
  RemoveViewerFromResourceInput,
  ResourceDoc,
  ResourcesInput
} from './schema';


import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';


class ResourceValidation {
  static async resourceExistsOrFail(resources: mongodb.Collection<ResourceDoc>,
    id: string): Promise<ResourceDoc> {
    return Validation.existsOrFail(resources, id, 'Resource');
  }
}

const actionRequestTable: ActionRequestTable = {
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
          mutation RemoveViewerFromResource($input: RemoveViewerFromResourceInput!) {
            removeViewerFromResource(input: $input) ${getReturnFields(extraInfo)}
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
  'show-resources': (extraInfo) => `
    query ShowResources($input: ResourcesInput!) {
      resources(input: $input) ${getReturnFields(extraInfo)}
    }
  `
}

function isPendingCreate(doc: ResourceDoc | null) {
  return _.get(doc, 'pending.type') === 'create-resource';
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const resources: mongodb.Collection<ResourceDoc> = db.collection('resources');

  return {
    Query: {
      resources: async (_root, { input }: { input: ResourcesInput }) => {
        const filter = { pending: { $exists: false } };
        if (input.createdBy) {
          filter['ownerId'] = input.createdBy;
        } else if (input.viewableBy) {
          filter['viewerIds'] = input.viewableBy;
        }

        return await resources
          .find(filter)
          .toArray();
      },

      resource: async (_root, { id }) => {
        const resource: ResourceDoc | null = await ResourceValidation
          .resourceExistsOrFail(resources, id);
        if (_.isNil(resource) || isPendingCreate(resource)) {
          throw new Error(`Resource ${id} not found`);
        }

        return resource;
      },

      owner: async (_root, { resourceId }) => {
        const resource = await resources
          .findOne({ id: resourceId }, { projection: { ownerId: 1 } });

        if (_.isNil(resource) || isPendingCreate(resource)) {
          throw new Error(`Resource ${resourceId} not found`);
        }

        return resource!.ownerId;
      },

      canView: async (_root, { input }: { input: PrincipalResourceInput }) => {
        const resource = await resources
          .findOne({ id: input.resourceId, viewerIds: input.principalId },
            { projection: { _id: 1 } });

        if (isPendingCreate(resource)) {
          return null;
        }

        return !_.isNil(resource);
      },

      canEdit: async (_root, { input }: { input: PrincipalResourceInput }) => {
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
        _root, { input }: { input: CreateResourceInput }, context: Context) => {
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

            return undefined;
          case 'abort':
            await resources.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return newResource;
      },

      addViewerToResource: async (
        _root,
        { input }: { input: AddViewerToResourceInput }, context: Context) => {
        const updateOp = { $push: { viewerIds: input.viewerId } };
        const notPendingResourceIdFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await ResourceValidation.resourceExistsOrFail(resources, input.id);
            const pendingUpdateObj = await resources
              .updateOne(
                notPendingResourceIdFilter,
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
            await ResourceValidation.resourceExistsOrFail(resources, input.id);
            const updateObj = await resources
              .updateOne(notPendingResourceIdFilter, updateOp);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await resources.updateOne(
              reqIdPendingFilter,
              { ...updateOp, $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await resources.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      },

      removeViewerFromResource: async (
        _root,
        { input }: { input: RemoveViewerFromResourceInput },
        context: Context) => {
        const updateOp = { $pull: { viewerIds: input.viewerId } };
        const notPendingResourceIdFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await ResourceValidation.resourceExistsOrFail(resources, input.id);
            const pendingUpdateObj = await resources
              .updateOne(
                notPendingResourceIdFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'remove-viewer-from-resource'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await ResourceValidation.resourceExistsOrFail(resources, input.id);
            const updateObj = await resources
              .updateOne(notPendingResourceIdFilter, updateOp);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await resources.updateOne(
              reqIdPendingFilter,
              { ...updateOp, $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await resources.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      },

      deleteResource: async (_root, { id }, context: Context) => {
        const notPendingResourceIdFilter = {
          id: id, pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await ResourceValidation.resourceExistsOrFail(resources, id);
            const pendingUpdateObj = await resources.updateOne(
              notPendingResourceIdFilter,
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
            await ResourceValidation.resourceExistsOrFail(resources, id);
            const res = await resources
              .deleteOne(notPendingResourceIdFilter);

            if (res.deletedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await resources.deleteOne(reqIdPendingFilter);

            return undefined;
          case 'abort':
            await resources.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      }
    }
  };
}

const authorizationCliche: ClicheServer =
  new ClicheServerBuilder('authorization')
    .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
      const resources: mongodb.Collection<ResourceDoc> =
        db.collection('resources');

      return Promise.all([
        resources.createIndex({ id: 1 }, { unique: true }),
        resources.createIndex({ id: 1, viewerIds: 1 }, { unique: true }),
        resources.createIndex({ id: 1, ownerId: 1 }, { unique: true })
      ]);
    })
    .actionRequestTable(actionRequestTable)
    .resolvers(resolvers)
    .build();

authorizationCliche.start();
