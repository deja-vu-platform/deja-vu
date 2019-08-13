import {
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/concept-server';
import {
  <%= classify(conceptName) %>Doc,
  Create<%= classify(conceptName) %>Input,
  Update<%= classify(conceptName) %>Input
} from './schema';

import { IResolvers } from 'graphql-tools';
import { v4 as uuid } from 'uuid';


// each component should be mapped to its corresponding GraphQl request here
const componentRequestTable: ComponentRequestTable = {
  'create-<%= dasherize(conceptName) %>': (extraInfo) => `
    mutation Create<%= classify(conceptName) %>($input: Create<%= classify(conceptName) %>Input!) {
      create<%= classify(conceptName) %>(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-<%= dasherize(conceptName) %>': (extraInfo) => `
    mutation Delete<%= classify(conceptName) %>($id: ID!) {
      delete<%= classify(conceptName) %>(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-<%= dasherize(conceptName) %>': (extraInfo) => `
    query Show<%= classify(conceptName) %>($id: ID!) {
      <%= camelize(conceptName) %>(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'update-<%= dasherize(conceptName) %>': (extraInfo) => {
    switch (extraInfo.component) {
      case 'update':
        return `
          mutation Update<%= classify(conceptName) %>($input: Update<%= classify(conceptName) %>Input!) {
            update<%= classify(conceptName) %> (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query <%= classify(conceptName) %>($id: ID!) {
            <%= camelize(conceptName) %>(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.component');
    }
  }
};

function resolvers(db: ConceptDb, _config: Config): IResolvers {
  const <%= camelize(conceptName) %>s: Collection<<%= classify(conceptName) %>Doc> = db.collection('<%= camelize(conceptName) %>s');

  return {
    Query: {
      <%= camelize(conceptName) %>: async (_root, { id }) =>
        await <%= camelize(conceptName) %>s.findOne({ id })
    },

    <%= classify(conceptName) %>: {
      id: (<%= camelize(conceptName) %>: <%= classify(conceptName) %>Doc) => <%= camelize(conceptName) %>.id,
      content: (<%= camelize(conceptName) %>: <%= classify(conceptName) %>Doc) => <%= camelize(conceptName) %>.content
    },

    Mutation: {
      create<%= classify(conceptName) %>: async (
        _root, { input }: { input: Create<%= classify(conceptName) %>Input }, context: Context) => {
        const <%= camelize(conceptName) %>: <%= classify(conceptName) %>Doc = {
          id: input.id ? input.id : uuid(),
          content: input.content
        };

        return await <%= camelize(conceptName) %>s.insertOne(context, <%= camelize(conceptName) %>);
      },

      update<%= classify(conceptName) %>: async (
        _root, { input }: { input: Update<%= classify(conceptName) %>Input }, context: Context) => {
        const updateOp = { $set: { content: input.content } };

        return await <%= camelize(conceptName) %>s.updateOne(context, { id: input.id }, updateOp);
      },

      delete<%= classify(conceptName) %>: async (_root, { id }, context: Context) =>
        await <%= camelize(conceptName) %>s.deleteOne(context, { id })
    }
  };
}

const <%= camelize(conceptName) %>Concept: ConceptServer = new ConceptServerBuilder('<%= camelize(conceptName) %>')
  .initDb((db: ConceptDb, _config: Config): Promise<any> => {
    const <%= camelize(conceptName) %>s: Collection<<%= classify(conceptName) %>Doc> = db.collection('<%= camelize(conceptName) %>s');

    return <%= camelize(conceptName) %>s.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

<%= camelize(conceptName) %>Concept.start();
