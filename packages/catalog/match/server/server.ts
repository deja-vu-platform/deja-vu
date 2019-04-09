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
  MatchDoc,
  CreateMatchInput,
  UpdateMatchInput
} from './schema';

import { v4 as uuid } from 'uuid';


// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'create-match': (extraInfo) => `
    mutation CreateMatch($input: CreateMatchInput!) {
      createMatch(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-match': (extraInfo) => `
    mutation DeleteMatch($id: ID!) {
      deleteMatch(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-match': (extraInfo) => `
    query ShowMatch($id: ID!) {
      match(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'update-match': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateMatch($input: UpdateMatchInput!) {
            updateMatch (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Match($id: ID!) {
            match(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  }
};

function resolvers(db: ClicheDb, _config: Config): object {
  const matchs: Collection<MatchDoc> = db.collection('matchs');

  return {
    Query: {
      match: async (_root, { id }) =>
        await matchs.findOne({ id })
    },

    Match: {
      id: (match: MatchDoc) => match.id,
      content: (match: MatchDoc) => match.content
    },

    Mutation: {
      createMatch: async (
        _root, { input }: { input: CreateMatchInput }, context: Context) => {
        const match: MatchDoc = {
          id: input.id ? input.id : uuid(),
          content: input.content
        };

        return await matchs.insertOne(context, match);
      },

      updateMatch: async (
        _root, { input }: { input: UpdateMatchInput }, context: Context) => {
        const updateOp = { $set: { content: input.content } };

        return await matchs.updateOne(context, { id: input.id }, updateOp);
      },

      deleteMatch: async (_root, { id }, context: Context) =>
        await matchs.deleteOne(context, { id })
    }
  };
}

const matchCliche: ClicheServer = new ClicheServerBuilder('match')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const matchs: Collection<MatchDoc> = db.collection('matchs');

    return matchs.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

matchCliche.start();
