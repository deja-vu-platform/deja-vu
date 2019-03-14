import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
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

const actionRequestTable: ActionRequestTable = {
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
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'follow-unfollow': (extraInfo) => {
    switch (extraInfo.action) {
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
        throw new Error('Need to specify extraInfo.action');
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

function isPendingCreate(doc: PublisherDoc | null) {
  return _.get(doc, 'pending.type') === 'create-publisher';
}

function getPublisherFilter(input: PublishersInput) {
  // No publisher filter
  const filter = { pending: { $exists: false } };
  if (!_.isNil(input) && !_.isNil(input.followedById)) {
    // Get all publishers of a follower
    filter['followerIds'] = input.followedById;
  }

  return filter;
}

function getFollowerAggregationPipeline(getCount = false) {
  const pipeline: any = [
    { $match: { pending: { $exists: false } } },
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
  ];

  if (getCount) {
    pipeline.push({ $project: { count: { $size: '$followerIds' } } });
  }

  return pipeline;
}

function getMessageAggregationPipeline(matchQuery: any, getCount = false) {
  const pipeline: any = [
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
];

  if (getCount) {
    pipeline.push({ $project: { count: { $size: '$messages' } } });
  }

  return pipeline;
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const publishers: mongodb.Collection<PublisherDoc> =
    db.collection('publishers');

  return {
    Query: {
      publisher: async (_root, { id }) => {
        const publisher: PublisherDoc | null =
          await publishers.findOne({ id: id });
        if (_.isNil(publisher) || isPendingCreate(publisher)) {
          throw new Error(`Publisher ${id} not found`);
        }

        return publisher;
      },

      message: async (_root, { id }) => {
        const publisher =
          await publishers.findOne({ 'messages.id': id },
            { projection: { 'messages.$': 1 } });

        if (_.isNil(publisher) || isPendingCreate(publisher)
          || _.isEmpty(publisher!.messages)) {
          throw new Error(`Message ${id} does not exist`);
        }

        return publisher!.messages![0];
      },

      followers: async (_root, { input }: { input: FollowersInput }) => {
        if (!_.isNil(input) && !_.isNil(input.ofPublisherId)) {
          // A publisher's followers
          const publisher = await publishers.findOne(
            { id: input.ofPublisherId, pending: { $exists: false } },
            { projection: { followerIds: 1 } }
          );

          if (_.isNil(publisher) || isPendingCreate(publisher)) {
            throw new Error(`Publisher ${input.ofPublisherId} not found`);
          }

          return !_.isEmpty(publisher!.followerIds) ?
            publisher!.followerIds : [];
        }

        // No follower filter
        const results = await publishers
          .aggregate(getFollowerAggregationPipeline())
          .toArray();

        return results[0] ? results[0].followerIds : [];
      },

      followerCount: async (_root, { input }: { input: FollowersInput }) => {

        if (!_.isNil(input) && !_.isNil(input.ofPublisherId)) {
          // A publisher's followers
          const res = await publishers.aggregate([
            {
              $match: {
                id: input.ofPublisherId,
                pending: { $exists: false }
              }
            },
            { $project: { count: { $size: '$memberIds' } } }
          ])
            .next();

          return res ? res['count'] : 0;
        }

        // No follower filter
        const results = await publishers
          .aggregate(getFollowerAggregationPipeline(true))
          .next();

        return results ? results['count'] : 0;
      },

      publishers: async (_root, { input }: { input: PublishersInput }) => {
        return publishers.find(getPublisherFilter(input))
          .toArray();
      },

      publisherCount: (_root, { input }: { input: PublishersInput }) => {
        return publishers.count(getPublisherFilter(input));
      },

      messages: async (_root, { input }: { input: MessagesInput }) => {
        const filter = { pending: { $exists: false } };
        if (!_.isNil(input) && !_.isNil(input.byPublisherId)) {
          filter['id'] = input.byPublisherId;

          // Get messages by a specific publisher
          const publisher = await publishers.findOne(
            filter,
            { projection: { messages: 1 } });

          if (_.isNil(publisher) || isPendingCreate(publisher)) {
            throw new Error(`Publisher ${input.byPublisherId} not found`);
          }

          return !_.isEmpty(publisher!.messages) ? publisher!.messages : [];

        } else {
          if (!_.isNil(input) && !_.isNil(input.ofPublishersFollowedById)) {
            // Get all the messages of publishers that a user follows
            filter['followerIds'] = input.ofPublishersFollowedById;
          }

          const results = await publishers
            .aggregate(getMessageAggregationPipeline(filter))
            .toArray();

          return results[0] ? results[0].messages : [];
        }
      },

      messageCount: async (_root, { input }: { input: MessagesInput }) => {
        const filter = { pending: { $exists: false } };

        if (!_.isNil(input) && !_.isNil(input.byPublisherId)) {
          filter['id'] = input.byPublisherId;
          // A publisher's messages
          const res = await publishers.aggregate([
            { $match: filter },
            { $project: { count: { $size: '$messages' } } }
          ])
            .next();

          return res ? res['count'] : 0;
        } else {
          if (!_.isNil(input) && !_.isNil(input.ofPublishersFollowedById)) {
            // Get all the messages of publishers that a user follows
            filter['followerIds'] = input.ofPublishersFollowedById;
          }

          const results = await publishers
            .aggregate(getMessageAggregationPipeline(filter, true))
            .next();

          return results ? results['count'] : 0;
        }
      },

      isFollowing: async (_root, { input }: { input: FollowUnfollowInput }) => {
        const publisher = await publishers
          .findOne({
            id: input.publisherId,
            followerIds: input.followerId,
            pending: { $exists: false }
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
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            newPublisher.pending = {
              reqId: context.reqId,
              type: 'create-publisher'
            };
          /* falls through */
          case undefined:
            await publishers.insertOne(newPublisher);

            return newPublisher;
          case 'commit':
            await publishers.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await publishers.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return newPublisher;
      },

      createMessage: async (
        _root, { input }: { input: CreateMessageInput }, context: Context) => {
        const messageId = input.id ? input.id : uuid();
        const newMessage: Message = {
          id: messageId,
          content: input.content
        };
        const updateOperation = { $push: { messages: newMessage } };
        const notPendingPublisherFilter = {
          id: input.publisherId,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            const pendingUpdateObj = await publishers
              .updateOne(
                notPendingPublisherFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'create-message'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return newMessage;
          case undefined:
            const updateObj = await publishers
              .updateOne(notPendingPublisherFilter, updateOperation);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return newMessage;
          case 'commit':
            await publishers.updateOne(
              reqIdPendingFilter,
              { ...updateOperation, $unset: { pending: '' } });

            return newMessage;
          case 'abort':
            await publishers.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return newMessage;
        }

        return newMessage;
      },

      editMessage: async (
        _root, { input }: { input: EditMessageInput }, context: Context) => {
        const updateOperation = {
          $set: { 'messages.$.content': input.content }
        };
        const notPendingPublisherFilter = {
          id: input.publisherId,
          'messages.id': input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            const pendingUpdateObj = await publishers
              .updateOne(
                notPendingPublisherFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'edit-message'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            const updateObj = await publishers
              .updateOne(notPendingPublisherFilter, updateOperation);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await publishers.updateOne(
              reqIdPendingFilter,
              { ...updateOperation, $unset: { pending: '' } });

            return true;
          case 'abort':
            await publishers.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return true;
        }

        return true;
      },

      follow: async (
        _root, { input }: { input: FollowUnfollowInput }, context: Context) => {
        const updateOperation = { $push: { followerIds: input.followerId } };

        const notPendingPublisherFilter = {
          id: input.publisherId,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            const pendingUpdateObj = await publishers
              .updateOne(
                notPendingPublisherFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'follow'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            const updateObj = await publishers
              .updateOne(notPendingPublisherFilter, updateOperation);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await publishers.updateOne(
              reqIdPendingFilter,
              { ...updateOperation, $unset: { pending: '' } });

            return true;
          case 'abort':
            await publishers.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return true;
        }

        return true;
      },

      unfollow: async (
        _root, { input }: { input: FollowUnfollowInput }, context: Context) => {
        const updateOperation = { $pull: { followerIds: input.followerId } };
        const notPendingPublisherFilter = {
          id: input.publisherId,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            const pendingUpdateObj = await publishers
              .updateOne(
                notPendingPublisherFilter,
                {
                  $set: {
                    pending: {
                      reqId: context.reqId,
                      type: 'unfollow'
                    }
                  }
                });
            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            const updateObj = await publishers
              .updateOne(notPendingPublisherFilter, updateOperation);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await publishers.updateOne(
              reqIdPendingFilter,
              { ...updateOperation, $unset: { pending: '' } });

            return true;
          case 'abort':
            await publishers.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return true;
        }

        return true;
      }
    }
  };
}

const followCliche: ClicheServer = new ClicheServerBuilder('follow')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const publishers: mongodb.Collection<PublisherDoc> =
      db.collection('publishers');

    return Promise.all([
      publishers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      publishers.createIndex({ id: 1, 'messages.id': 1 }, { unique: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

followCliche.start();
