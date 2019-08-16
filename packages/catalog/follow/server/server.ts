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
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import {
  CreateMessageInput,
  EditMessageInput,
  FollowersInput,
  FollowUnfollowInput,
  Message,
  MessagesInput,
  PublisherDoc,
  PublishersInput
} from './schema';

import { v4 as uuid } from 'uuid';

const componentRequestTable: ComponentRequestTable = {
  'create-message': (extraInfo) => `
    mutation CreateMessage($input: CreateMessageInput!) {
      createMessage (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-publisher': (extraInfo) => `
    mutation CreatePublisher($id: ID!) {
      createPublisher(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'edit-message': (extraInfo) => {
    switch (extraInfo.action) {
      case 'load':
        return `
          query EditMessage($id: ID!) {
            message(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      case 'edit':
        return `
          mutation EditMessage($input: EditMessageInput!) {
            editMessage(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.component');
    }
  },
  'follow-unfollow': (extraInfo) => {
    switch (extraInfo.component) {
      case 'follow':
        return `
          mutation FollowUnfollow($input: FollowUnfollowInput!) {
            follow(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'unfollow':
        return `
          mutation FollowUnfollow($input: FollowUnfollowInput!) {
            unfollow(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'is-follower':
        return `
          query FollowUnfollow($input: FollowUnfollowInput!) {
            isFollowing(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.component');
    }
  },
  'show-followers': (extraInfo) => `
    query ShowFollowers($input: FollowersInput!) {
      followers(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-follower-count': (extraInfo) => `
    query ShowFollowerCount($input: FollowersInput!) {
      followerCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-messages': (extraInfo) => `
    query ShowMessages($input: MessagesInput!) {
      messages(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-message-count': (extraInfo) => `
    query ShowMessageCount($input: MessagesInput!) {
      messageCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-publishers': (extraInfo) => `
    query ShowPublisherCount($input: PublishersInput!) {
      publishers(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-publisher-count': (extraInfo) => `
    query ShowPublishers($input: PublishersInput!) {
      publisherCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function getPublisherFilter(input: PublishersInput) {
  // No publisher filter
  const filter = { pending: { $exists: false } };
  if (!_.isNil(input) && !_.isNil(input.followedById)) {
    // Get all publishers of a follower
    filter['followerIds'] = input.followedById;
  }

  return filter;
}

async function getAggregatedMessages(
  publishers: Collection<PublisherDoc>,
  matchQuery: any): Promise<PublisherDoc[]> {
  return await publishers.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: 0,
        messages: { $push: '$messages' }
      }
    },
    {
      $project: {
        messages: {
          $reduce: {
            input: '$messages',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }
        }
      }
    }
  ])
    .toArray();
}

function resolvers(db: ConceptDb, _config: Config): IResolvers {
  const publishers: Collection<PublisherDoc> = db.collection('publishers');

  return {
    Query: {
      publisher: async (_root, { id }) => await publishers.findOne({ id: id }),

      message: async (_root, { id }) => {
        const publisher =
          await publishers.findOne({ 'messages.id': id },
            { projection: { 'messages.$': 1 } });

        if (_.isEmpty(publisher!.messages)) {
          throw new Error(`Message ${id} does not exist`);
        }

        return publisher!.messages![0];
      },

      followers: async (_root, { input }: { input: FollowersInput }) => {
        if (!_.isNil(input) && !_.isNil(input.ofPublisherId)) {
          // A publisher's followers
          const publisher = await publishers.findOne(
            { id: input.ofPublisherId },
            { projection: { followerIds: 1 } }
          );

          return publisher.followerIds;
        }

        // No follower filter
        const results = await publishers.aggregate([
          {
            $group: {
              _id: 0,
              followerIds: { $push: '$followerIds' }
            }
          },
          {
            $project: {
              followerIds: {
                $reduce: {
                  input: '$followerIds',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] }
                }
              }
            }
          }
        ])
          .toArray();

        return results[0] ? results[0].followerIds : [];
      },

      publishers: async (_root, { input }: { input: PublishersInput }) => {
        const filter = {};
        if (input.followedById) {
          // Get all publishers of a follower
          filter['followerIds'] = input.followedById;
        }

        return await publishers.find(filter);
      },

      publisherCount: (_root, { input }: { input: PublishersInput }) => {
        return publishers.countDocuments(getPublisherFilter(input));
      },

      messages: async (_root, { input }: { input: MessagesInput }) => {
        if (input.byPublisherId) {
          // Get messages by a specific publisher
          const publisher = await publishers.findOne(
            { id: input.byPublisherId },
            { projection: { messages: 1 } });

          return publisher.messages;

        }

        const filter = {};
        if (input.ofPublishersFollowedById) {
          filter['followerIds'] = input.ofPublishersFollowedById;
        }

        const results = await getAggregatedMessages(publishers, filter);

        return results[0] ? results[0].messages : [];
      },

      isFollowing: async (_root, { input }: { input: FollowUnfollowInput }) => {
        const publisher = await publishers
          .findOne({
            id: input.publisherId,
            followerIds: input.followerId
          },
          { projection: { _id: 1 } });

        return !_.isNil(publisher);
      }

    },

    Publisher: {
      id: (publisher: PublisherDoc) => publisher.id,
      messages: (publisher: PublisherDoc) => publisher.messages,
      followerIds: (publisher: PublisherDoc) => publisher.followerIds
    },

    Message: {
      id: (message: Message) => message.id,
      content: (message: Message) => message.content
    },

    Mutation: {
      createPublisher: async (_root, { id }, context: Context) => {
        const publisherId = id ? id : uuid();
        const newPublisher: PublisherDoc = { id: publisherId };

        return await publishers.insertOne(context, newPublisher);
      },

      createMessage: async (
        _root, { input }: { input: CreateMessageInput }, context: Context) => {
        const messageId = input.id ? input.id : uuid();
        const newMessage: Message = {
          id: messageId,
          content: input.content
        };
        const updateOperation = { $push: { messages: newMessage } };
        await publishers.updateOne(
          context, { id: input.publisherId }, updateOperation);

        return newMessage;
      },

      editMessage: async (
        _root, { input }: { input: EditMessageInput }, context: Context) => {
        const updateOperation = {
          $set: { 'messages.$.content': input.content }
        };

        return await publishers.updateOne(
          context, { id: input.publisherId, 'messages.id': input.id },
          updateOperation);
      },

      follow: async (
        _root, { input }: { input: FollowUnfollowInput }, context: Context) => {
        const updateOperation = { $push: { followerIds: input.followerId } };

        return await publishers.updateOne(
          context, { id: input.publisherId }, updateOperation);
      },

      unfollow: async (
        _root, { input }: { input: FollowUnfollowInput }, context: Context) => {
        const updateOperation = { $pull: { followerIds: input.followerId } };

        return await publishers.updateOne(
          context, { id: input.publisherId }, updateOperation);
      }
    }
  };
}

const followConcept: ConceptServer = new ConceptServerBuilder('follow')
  .initDb((db: ConceptDb, _config: Config): Promise<any> => {
    const publishers: Collection<PublisherDoc> = db.collection('publishers');

    return Promise.all([
      publishers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      publishers.createIndex({ id: 1, 'messages.id': 1 }, { unique: true })
    ]);
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

followConcept.start();
