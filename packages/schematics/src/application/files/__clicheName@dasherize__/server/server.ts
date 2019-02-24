import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import {
  <%= classify(clicheName) %>Doc,
  Create<%= classify(clicheName) %>Input
} from './schema';

import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';

// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'create-<%= dasherize(clicheName) %>': (extraInfo) => `
    mutation Create<%= classify(clicheName) %>($input: Create<%= classify(clicheName) %>Input!) {
      create<%= classify(clicheName) %>(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-<%= dasherize(clicheName) %>': (extraInfo) => `
    query Show<%= classify(clicheName) %>($id: ID!) {
      <%= camelize(clicheName) %>(id: $id) ${getReturnFields(extraInfo)}
    }
  `
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
      id: (<%= camelize(clicheName) %>: <%= classify(clicheName) %>Doc) => <%= camelize(clicheName) %>.id
    },

    Mutation: {
      create<%= classify(clicheName) %>: async (
        _root, { input }: { input: Create<%= classify(clicheName) %>Input }, context: Context) => {
        const <%= camelize(clicheName) %>: <%= classify(clicheName) %>Doc = {
          id: input.id ? input.id : uuid()
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
