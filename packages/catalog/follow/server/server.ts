import {
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context
} from 'cliche-server';
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


function isPendingCreate(doc: PublisherDoc | null) {
  return _.get(doc, 'pending.type') === 'create-publisher';
}

async function getAggregatedMessages(
  publishers: mongodb.Collection<PublisherDoc>,
  matchQuery: any): Promise<PublisherDoc[]> {
  const results = await publishers.aggregate([
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

  return results;
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
        if (input.ofPublisherId) {
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
        const results = await publishers.aggregate([
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
        ])
          .toArray();

        return results[0].followerIds;
      },

      publishers: async (_root, { input }: { input: PublishersInput }) => {
        const filter = { pending: { $exists: false } };
        if (input.followedById) {
          // Get all publishers of a follower
          filter['followerIds'] = input.followedById;

          return publishers.find(filter)
            .toArray();
        }

        // No publisher filter
        return publishers.find(filter)
          .toArray();
      },

      messages: async (_root, { input }: { input: MessagesInput }) => {
        const filter = { pending: { $exists: false } };
        if (input.byPublisherId) {
          // Get messages by a specific publisher
          const publisher = await publishers.findOne(
            { id: input.byPublisherId, pending: { $exists: false } },
            { projection: { messages: 1 } });

          if (_.isNil(publisher) || isPendingCreate(publisher)) {
            throw new Error(`Publisher ${input.byPublisherId} not found`);
          }

          return !_.isEmpty(publisher!.messages) ? publisher!.messages : [];

        } else if (input.ofPublishersFollowedById) {
          filter['followerIds'] = input.ofPublishersFollowedById;
          const results = await getAggregatedMessages(publishers, filter);

          return results[0].messages;

        } else {
          // No message filter
          const results = await getAggregatedMessages(publishers, filter);

          return results[0].messages;
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
      publishers.createIndex({ 'messages.id': 1 }, { unique: true })
    ]);
  })
  .resolvers(resolvers)
  .build();

followCliche.start();
