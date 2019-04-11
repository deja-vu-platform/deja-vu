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
  ChatDoc,
  CreateChatInput,
  UpdateChatInput
} from './schema';

import { v4 as uuid } from 'uuid';


// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'create-chat': (extraInfo) => `
    mutation CreateChat($input: CreateChatInput!) {
      createChat(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-chat': (extraInfo) => `
    mutation DeleteChat($id: ID!) {
      deleteChat(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-chat': (extraInfo) => `
    query ShowChat($id: ID!) {
      chat(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'update-chat': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateChat($input: UpdateChatInput!) {
            updateChat (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Chat($id: ID!) {
            chat(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  }
};

function resolvers(db: ClicheDb, _config: Config): object {
  const chats: Collection<ChatDoc> = db.collection('chats');

  return {
    Query: {
      chat: async (_root, { id }) =>
        await chats.findOne({ id })
    },

    Chat: {
      id: (chat: ChatDoc) => chat.id,
      content: (chat: ChatDoc) => chat.content
    },

    Mutation: {
      createChat: async (
        _root, { input }: { input: CreateChatInput }, context: Context) => {
        const chat: ChatDoc = {
          id: input.id ? input.id : uuid(),
          content: input.content
        };

        return await chats.insertOne(context, chat);
      },

      updateChat: async (
        _root, { input }: { input: UpdateChatInput }, context: Context) => {
        const updateOp = { $set: { content: input.content } };

        return await chats.updateOne(context, { id: input.id }, updateOp);
      },

      deleteChat: async (_root, { id }, context: Context) =>
        await chats.deleteOne(context, { id })
    }
  };
}

const chatCliche: ClicheServer = new ClicheServerBuilder('chat')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const chats: Collection<ChatDoc> = db.collection('chats');

    return chats.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

chatCliche.start();
