import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

interface PublisherDoc {
  id: string;
  messages?: Message[];
  followerIds?: string[];
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-publisher' | 'create-message' | 'edit-message' |
  'follow' | 'unfollow';
}

interface Message {
  id: string;
  content: string;
}

interface CreateMessageInput {
  id?: string;
  publisherId: string;
  content: string;
}

interface FollowersInput {
  ofPublisherId?: string;
}

interface PublishersInput {
  followedById?: string;
}

interface MessagesInput {
  ofPublishersFollowedById?: string;
  byPublisherId?: string;
}

interface EditMessageInput {
  id: string;
  publisherId: string;
  content: string;
}

interface FollowUnfollowInput {
  followerId: string;
  publisherId: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'follow';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = { ...DEFAULT_CONFIG, ...configArg };

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db;
let publishers: mongodb.Collection<PublisherDoc>;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    publishers = db.collection('publishers');
    publishers.createIndex({ id: 1 }, { unique: true, sparse: true });
    publishers.createIndex({ 'messages.id': 1 }, { unique: true });
  });

const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: PublisherDoc | null) {
  return _.get(doc, 'pending.type') === 'create-publisher';
}

async function getAggregatedMessages(matchQuery: any): Promise<PublisherDoc[]> {
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

const resolvers = {
  Query: {
    publisher: async (root, { id }) => {
      const publisher: PublisherDoc | null =
        await publishers.findOne({ id: id });
      if (_.isNil(publisher) || isPendingCreate(publisher)) {
        throw new Error(`Publisher ${id} not found`);
      }

      return publisher;
    },

    message: async (root, { id }) => {
      const publisher =
        await publishers.findOne({ 'messages.id': id },
          { projection: { 'messages.$': 1 } });

      if (_.isNil(publisher) || isPendingCreate(publisher)
        || _.isEmpty(publisher!.messages)) {
        throw new Error(`Message ${id} does not exist`);
      }

      return publisher!.messages![0];
    },

    followers: async (root, { input }: { input: FollowersInput }) => {
      if (input.ofPublisherId) {
        // A publisher's followers
        const publisher = await publishers.findOne(
          { id: input.ofPublisherId, pending: { $exists: false } },
          { projection: { followerIds: 1 } }
        );

        if (_.isNil(publisher) || isPendingCreate(publisher)) {
          throw new Error(`Publisher ${input.ofPublisherId} not found`);
        }

        return !_.isEmpty(publisher!.followerIds) ? publisher!.followerIds : [];
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

    publishers: async (root, { input }: { input: PublishersInput }) => {
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

    messages: async (root, { input }: { input: MessagesInput }) => {
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
        const results = await getAggregatedMessages(filter);

        return results[0].messages;

      } else {
        // No message filter
        const results = await getAggregatedMessages(filter);

        return results[0].messages;
      }
    },

    isFollowing: async (root, { input }: { input: FollowUnfollowInput }) => {
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
    createPublisher: async (root, { id }, context: Context) => {
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

          return;
        case 'abort':
          await publishers.deleteOne(reqIdPendingFilter);

          return;
      }

      return newPublisher;
    },

    createMessage: async (
      root, { input }: { input: CreateMessageInput }, context: Context) => {
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

          return;
        case 'abort':
          await publishers.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return newMessage;
      }
    },

    editMessage: async (
      root, { input }: { input: EditMessageInput }, context: Context) => {
      const updateOperation = { $set: { 'messages.$.content': input.content } };
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

          return;
        case 'abort':
          await publishers.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return true;
      }
    },

    follow: async (
      root, { input }: { input: FollowUnfollowInput }, context: Context) => {
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

          return;
        case 'abort':
          await publishers.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return true;
      }
    },

    unfollow: async (
      root, { input }: { input: FollowUnfollowInput }, context: Context) => {
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

          return;
        case 'abort':
          await publishers.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return true;
      }
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
