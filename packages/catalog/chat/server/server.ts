import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  getReturnFields,
  isSuccessfulContext,
  Validation
} from '@deja-vu/concept-server';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { IResolvers } from 'graphql-tools';
import {
  ChatMessagesInput,
  CreateMessageInput,
  MessageDoc,
  NewChatMessagesInput,
  UpdateMessageInput
} from './schema';

import { v4 as uuid } from 'uuid';


// TODO: update to use a PubSub implementation backed by an external store
// so that it's fit for production use:
// https://github.com/apollographql/graphql-subscriptions#pubsub-implementations
const pubsub = new PubSub();
const NEW_MESSAGE_TOPIC = 'new-message';

const MS_IN_S = 1000;

function dateToUnixTime(date: Date): number {
  return date.valueOf() / MS_IN_S;
}

interface MessageConfig extends Config {
  /* Whether only authors can edit/delete their own messages or not */
  onlyAuthorCanEdit?: boolean;
}

class MessageValidation {
  static async messageExistsOrFails(
    messages: Collection<MessageDoc>, id: string): Promise<MessageDoc> {
    return Validation.existsOrFail(messages, id, 'Message');
  }
}

// each component should be mapped to its corresponding GraphQl request here
const componentRequestTable: ComponentRequestTable = {
  'create-message': (extraInfo) => `
    mutation CreateMessage($input: CreateMessageInput!) {
      createMessage(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-message': (extraInfo) => `
    mutation DeleteMessage($id: ID!) {
      deleteMessage(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'update-message': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateMessage($input: UpdateMessageInput!) {
            updateMessage(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Message($id: ID!) {
            message(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-chat': (extraInfo) => {
    switch (extraInfo.action) {
      case 'subscribe':
        return `subscription NewChatMessage($chatId: ID!) {
          newChatMessage(chatId: $chatId)
        }`;
      case 'new':
        // note that this is unused, but should potentially be used
        // to avoid overfetching of all past messages
        return `
          query NewChatMessages($input: NewChatMessagesInput!) {
            newChatMessages(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        return `
          query ChatMessages($input: ChatMessagesInput!) {
            chatMessages(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
    }
  },
  'show-message': (extraInfo) => `
    query ShowMessage($id: ID!) {
      message(id: $id) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ConceptDb, config: MessageConfig): IResolvers {
  const messages: Collection<MessageDoc> = db.collection('messages');

  return {
    Query: {
      message: async (_root, { id }) => await messages.findOne({ id }),

      chatMessages: async (_root, { input }: { input: ChatMessagesInput })
      : Promise<MessageDoc[]> => {
        const limit = input.maxMessageCount ? input.maxMessageCount : 0;

        return (await messages.findCursor({
          chatId: input.chatId
        }))
        .sort({ timestamp: 1 })  // ascending sort (most recent msg first)
        .limit(limit)
        .toArray();
      },
      newChatMessages: async (_root, { input }: { input: NewChatMessagesInput })
      : Promise<MessageDoc[]> =>
        (await messages.findCursor({
          chatId: input.chatId,
          timestamp: { $gt: input.lastMessageTimestamp }
        }))
        .sort({ timestamp: 1 })  // ascending sort (most recent msg first)
        .toArray()
    },

    Message: {
      id: (message: MessageDoc) => message.id,
      content: (message: MessageDoc) => message.content,
      timestamp: (message: MessageDoc) => dateToUnixTime(message.timestamp),
      authorId: (message: MessageDoc) => message.authorId,
      chatId: (message: MessageDoc) => message.chatId
    },

    Mutation: {
      createMessage: async (
        _root, { input }: { input: CreateMessageInput }, context: Context) => {
        const message: MessageDoc = {
          id: input.id ? input.id : uuid(),
          content: input.content,
          timestamp: new Date(),
          authorId: input.authorId,
          chatId: input.chatId
        };

        return await messages.insertOne(context, message)
          .then((newMessage) => {
            if (isSuccessfulContext(context)) {
              pubsub.publish(NEW_MESSAGE_TOPIC, { newMessage });
            }

            return newMessage;
          });
      },

      updateMessage: async (
        _root, { input }: { input: UpdateMessageInput }, context: Context) => {
        if (config.onlyAuthorCanEdit) {
          const message = await MessageValidation.messageExistsOrFails(
            messages, input.id);
          // IMPORTANT: No explicit transaction logic here to make this atomic
          // only because Message authorIds CANNOT be changed.
          // If for some reason editing Message authorIds becomes possible,
          // this functionality will be broken.
          // Note that the authorization concept could also be used
          // to get the same functionality.
          if (message.authorId !== input.authorId) {
            throw new Error('Only the author of the message can edit it.');
          }
        }

        // TODO: include last updated timestamp?
        const updateOp = { $set: { content: input.content } };

        return await messages.updateOne(context, { id: input.id }, updateOp);
      },

      deleteMessage: async (_root, { id }, context: Context) =>
        await messages.deleteOne(context, { id })
    },

    Subscription: {
      newChatMessage: {
        resolve: (_payload, _args, _context, _info) => {
          // for security, just return true to subscribers and
          // make them do another query to get the new info
          return true;
        },
        subscribe: withFilter(
          () => pubsub.asyncIterator(NEW_MESSAGE_TOPIC),
          (payload, variables) =>
            variables.chatId === payload.newMessage.chatId
        )
      }
    }
  };
}

const chatConcept: ConceptServer = new ConceptServerBuilder('chat')
  .initDb((db: ConceptDb, _config: Config): Promise<any> => {
    const messages: Collection<MessageDoc> = db.collection('messages');

    return Promise.all([
      messages.createIndex({ id: 1 }, { unique: true, sparse: true }),
      messages.createIndex({ chatId: 1, timestamp: 1 })
    ]);
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

chatConcept.start();
