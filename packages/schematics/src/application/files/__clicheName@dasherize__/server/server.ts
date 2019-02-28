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
  <%= classify(clicheName) %>Doc,
  Create<%= classify(clicheName) %>Input,
  Update<%= classify(clicheName) %>Input
} from './schema';

import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';


class <%= classify(clicheName) %>Validation {
  static async <%= camelize(clicheName) %>ExistsOrFails(
    <%= camelize(clicheName) %>s: mongodb.Collection<<%= classify(clicheName) %>Doc>, id: string): Promise<<%= classify(clicheName) %>Doc> {
    return Validation.existsOrFail(<%= camelize(clicheName) %>s, id, '<%= classify(clicheName) %>');
  }
}

// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'create-<%= dasherize(clicheName) %>': (extraInfo) => `
    mutation Create<%= classify(clicheName) %>($input: Create<%= classify(clicheName) %>Input!) {
      create<%= classify(clicheName) %>(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-<%= dasherize(clicheName) %>': (extraInfo) => `
    mutation Delete<%= classify(clicheName) %>($id: ID!) {
      delete<%= classify(clicheName) %>(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-<%= dasherize(clicheName) %>': (extraInfo) => `
    query Show<%= classify(clicheName) %>($id: ID!) {
      <%= camelize(clicheName) %>(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'update-<%= dasherize(clicheName) %>': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation Update<%= classify(clicheName) %>($input: Update<%= classify(clicheName) %>Input!) {
            update<%= classify(clicheName) %> (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query <%= classify(clicheName) %>($id: ID!) {
            <%= camelize(clicheName) %>(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  }
};

function isPendingCreate(doc: <%= classify(clicheName) %>Doc | null) {
  return _.get(doc, 'pending.type') === 'create-<%= dasherize(clicheName) %>';
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const <%= camelize(clicheName) %>s: mongodb.Collection<<%= classify(clicheName) %>Doc> = db.collection('<%= camelize(clicheName) %>s');

  return {
    Query: {
      <%= camelize(clicheName) %>: async (_root, { id }) => {
        const <%= camelize(clicheName) %> = await <%= camelize(clicheName) %>s.findOne({ id });

        if (_.isNil(<%= camelize(clicheName) %>) || isPendingCreate(<%= camelize(clicheName) %>)) {
          throw new Error(`<%= capitalize(clicheName) %> ${id} not found`);
        }

        return <%= camelize(clicheName) %>;
      }
    },

    <%= classify(clicheName) %>: {
      id: (<%= camelize(clicheName) %>: <%= classify(clicheName) %>Doc) => <%= camelize(clicheName) %>.id,
      content: (<%= camelize(clicheName) %>: <%= classify(clicheName) %>Doc) => <%= camelize(clicheName) %>.content
    },

    Mutation: {
      create<%= classify(clicheName) %>: async (
        _root, { input }: { input: Create<%= classify(clicheName) %>Input }, context: Context) => {
        const <%= camelize(clicheName) %>: <%= classify(clicheName) %>Doc = {
          id: input.id ? input.id : uuid(),
          content: input.content
        };

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            <%= camelize(clicheName) %>.pending = { reqId: context.reqId, type: 'create-<%= dasherize(clicheName) %>' };
            /* falls through */
          case undefined:
            await <%= camelize(clicheName) %>s.insertOne(<%= camelize(clicheName) %>);

            return <%= camelize(clicheName) %>;
          case 'commit':
            await <%= camelize(clicheName) %>s.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await <%= camelize(clicheName) %>s.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return <%= camelize(clicheName) %>;
      },

      update<%= classify(clicheName) %>: async (
        _root, { input }: { input: Update<%= classify(clicheName) %>Input }, context: Context) => {
        const updateOp = { $set: { content: input.content } };
        const notPending<%= classify(clicheName) %>IdFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await <%= classify(clicheName) %>Validation.<%= camelize(clicheName) %>ExistsOrFails(<%= camelize(clicheName) %>s, input.id);
            const pendingUpdateObj = await <%= camelize(clicheName) %>s
              .updateOne(
                notPending<%= classify(clicheName) %>IdFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'update-<%= dasherize(clicheName) %>'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await <%= classify(clicheName) %>Validation.<%= camelize(clicheName) %>ExistsOrFails(<%= camelize(clicheName) %>s, input.id);
            const updateObj = await <%= camelize(clicheName) %>s
              .updateOne(notPending<%= classify(clicheName) %>IdFilter, updateOp);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return updateObj.modifiedCount === 1;
          case 'commit':
            await <%= camelize(clicheName) %>s.updateOne(
              reqIdPendingFilter,
              { ...updateOp, $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await <%= camelize(clicheName) %>s.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      },

      delete<%= classify(clicheName) %>: async (_root, { id }, context: Context) => {
        const notPending<%= classify(clicheName) %>IdFilter = {
          id: id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await <%= classify(clicheName) %>Validation.<%= camelize(clicheName) %>ExistsOrFails(<%= camelize(clicheName) %>s, id);
            const pendingUpdateObj = await <%= camelize(clicheName) %>s.updateOne(
              notPending<%= classify(clicheName) %>IdFilter,
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'delete-<%= dasherize(clicheName) %>'
                  }
                }
              });

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await <%= classify(clicheName) %>Validation.<%= camelize(clicheName) %>ExistsOrFails(<%= camelize(clicheName) %>s, id);
            const res = await <%= camelize(clicheName) %>s
              .deleteOne(notPending<%= classify(clicheName) %>IdFilter);

            if (res.deletedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await <%= camelize(clicheName) %>s.deleteOne(reqIdPendingFilter);

            return undefined;
          case 'abort':
            await <%= camelize(clicheName) %>s.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      }
    }
  };
}

const <%= camelize(clicheName) %>Cliche: ClicheServer = new ClicheServerBuilder('<%= camelize(clicheName) %>')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const <%= camelize(clicheName) %>s: mongodb.Collection<<%= classify(clicheName) %>Doc> = db.collection('<%= camelize(clicheName) %>s');

    return <%= camelize(clicheName) %>s.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

<%= camelize(clicheName) %>Cliche.start();
