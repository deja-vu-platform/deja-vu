import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import {
  <%= classify(clicheName) %>Doc,
  Create<%= classify(clicheName) %>Input,
  Update<%= classify(clicheName) %>Input
} from './schema';

import { IResolvers } from 'graphql-tools';
import { v4 as uuid } from 'uuid';


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

function resolvers(db: ClicheDb, _config: Config): IResolvers {
  const <%= camelize(clicheName) %>s: Collection<<%= classify(clicheName) %>Doc> = db.collection('<%= camelize(clicheName) %>s');

  return {
    Query: {
      <%= camelize(clicheName) %>: async (_root, { id }) =>
        await <%= camelize(clicheName) %>s.findOne({ id })
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

        return await <%= camelize(clicheName) %>s.insertOne(context, <%= camelize(clicheName) %>);
      },

      update<%= classify(clicheName) %>: async (
        _root, { input }: { input: Update<%= classify(clicheName) %>Input }, context: Context) => {
        const updateOp = { $set: { content: input.content } };

        return await <%= camelize(clicheName) %>s.updateOne(context, { id: input.id }, updateOp);
      },

      delete<%= classify(clicheName) %>: async (_root, { id }, context: Context) =>
        await <%= camelize(clicheName) %>s.deleteOne(context, { id })
    }
  };
}

const <%= camelize(clicheName) %>Cliche: ClicheServer = new ClicheServerBuilder('<%= camelize(clicheName) %>')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const <%= camelize(clicheName) %>s: Collection<<%= classify(clicheName) %>Doc> = db.collection('<%= camelize(clicheName) %>s');

    return <%= camelize(clicheName) %>s.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

<%= camelize(clicheName) %>Cliche.start();
