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
import { PubSub, withFilter } from 'graphql-subscriptions';
import { IResolvers } from 'graphql-tools';
import {
  ChatDoc,
  CreateChatInput,
  UpdateChatInput
} from './schema';

import { v4 as uuid } from 'uuid';

const pubsub = new PubSub();
const UPDATED_CHAT_TOPIC = 'updated-chat';

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
  'show-chat': (extraInfo) => {
    switch (extraInfo.action) {
      case 'subscribe':
        return `subscription updatedChat($id: ID!) { updatedChat(id: $id) }`;
      default:
        return `
          query ShowChat($id: ID!) {
            chat(id: $id) ${getReturnFields(extraInfo)}
          }
        `
    }
  },
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

function resolvers(db: ClicheDb, _config: Config): IResolvers {
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

        return await chats.updateOne(context, { id: input.id }, updateOp)
          .then((result) => {
            if (context.reqType == 'commit' || context.reqType == undefined) {
              pubsub.publish(UPDATED_CHAT_TOPIC, { updatedChat: input.id });
            }

            return result;
          });
      },

      deleteChat: async (_root, { id }, context: Context) =>
        await chats.deleteOne(context, { id })
    },

    Subscription: {
      updatedChat: {
        resolve: (_payload, _args, _context, _info) => {
          // for security, just return true to subscribers and
          // make them do another query to get the new info
          return true;
        },
        subscribe: withFilter(
          () => pubsub.asyncIterator(UPDATED_CHAT_TOPIC),
          (payload, variables) => payload.updatedChat === variables.id
        ),
      },
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
