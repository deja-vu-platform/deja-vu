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
  publisherId?: string;
}

interface PublishersInput {
  followerId?: string;
}

interface MessagesInput {
  followerId?: string;
  publisherId?: string;
}

interface EditFollowerInput {
  oldId: string;
  newId: string;
}

interface EditPublisherInput {
  oldId: string;
  newId: string;
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
  });

const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

function isDifferent(before: string, after: string, type: string): Boolean {
  if (before === after) {
    throw new Error(`The current and new ${type}s must be different`);
  }

  return true;
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
    publisher: (root, { id }) => publishers.findOne({ id: id }),

    message: async (root, { id }) => {
      const publisher =
        await publishers.findOne({ 'messages.id': id });

      if (!publisher) { throw new Error(`Message ${id} does not exist`); }

      return _.find(publisher.messages, { id: id });
    },

    followers: async (root, { input }: { input: FollowersInput }) => {
      if (input.publisherId) {
        // A publisher's followers
        const publisher = await publishers.findOne({ id: input.publisherId });

        if (!publisher) {
          throw new Error(`Publisher ${input.publisherId} does not exist`);
        }

        return !_.isEmpty(publisher.followerIds) ? publisher.followerIds : [];
      }

      // No follower filter
      const results = await publishers.aggregate([
        { $match: { } },
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
      if (input.followerId) {
        // Get all publishers of a follower
        return publishers
          .find({ followerIds: input.followerId })
          .toArray();
      }

      // No publisher filter
      return publishers.find()
        .toArray();
    },

    messages: async (root, { input }: { input: MessagesInput }) => {
      if (input.publisherId) {
        // Get messages by a specific publisher
        const publisher = await publishers.findOne({ id: input.publisherId });
        if (!publisher) {
          throw new Error(`Publisher ${input.publisherId} does not exist`);
        }

        return !_.isEmpty(publisher.messages) ? publisher.messages : [];

      } else if (input.followerId) {

        const results =
          await getAggregatedMessages({ followerIds: input.followerId });

        return results[0].messages;

      } else {
        // No message filter
        const results =
          await getAggregatedMessages({});

        return results[0].messages;
      }
    },

    isFollowing: async (root, { input }: { input: FollowUnfollowInput }) => {
      const publisher = await publishers
        .findOne({ id: input.publisherId, followerIds: input.followerId });

      return !_.isEmpty(publisher);
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
    createPublisher: async (root, { id }) => {
      const publisherId = id ? id : uuid();
      const newPublisher: PublisherDoc = { id: publisherId };
      await publishers.insertOne(newPublisher);

      return newPublisher;
    },

    createMessage: async (root, { input }: { input: CreateMessageInput }) => {
      const messageId = input.id ? input.id : uuid();
      const newMessage: Message = {
        id: messageId,
        content: input.content
      };
      const updateOperation = { $push: { messages: newMessage } };
      await publishers.updateOne({ id: input.publisherId }, updateOperation);

      return newMessage;
    },

    editFollower: async (root, { input }: { input: EditFollowerInput }) => {
      isDifferent(input.oldId, input.newId, 'Follower');

      const pubs = await publishers.find({ followerIds: input.oldId })
        .toArray();

      if (_.isEmpty(pubs)) {
        throw new Error(`Follower ${input.oldId} does not exist`);
      }

      const addFollowerUpdate = { $push: { followerIds: input.newId } };
      const removeFollowerUpdate = { $pull: { followerIds: input.oldId } };
      await publishers
        .updateMany({ followerIds: input.oldId }, addFollowerUpdate);
      await publishers
        .updateMany({ followerIds: input.newId }, removeFollowerUpdate);

      return true;
    },

    editPublisher: async (root, { input }: { input: EditPublisherInput }) => {
      isDifferent(input.oldId, input.newId, 'Publisher');

      const updateOperation = { $set: { id: input.newId } };
      await publishers.updateOne({ id: input.oldId }, updateOperation);

      return true;
    },

    editMessage: async (root, { input }: { input: EditMessageInput }) => {
      const updateOperation = { $set: { 'messages.$.content': input.content } };
      const updatedObj = await publishers.updateOne(
        { id: input.publisherId, 'messages.id': input.id },
        updateOperation);

      if (updatedObj.modifiedCount === 0 || updatedObj.matchedCount === 0) {
        throw new Error(`Message/ Publisher does not exist
        AND you must be the publisher to edit the message`);
      }

      return true;
    },

    follow: async (root, { input }: { input: FollowUnfollowInput }) => {
      const updateOperation = { $push: { followerIds: input.followerId } };
      const updatedObj = await publishers
        .updateOne({ id: input.publisherId }, updateOperation);

      if (updatedObj.matchedCount === 0) {
        throw new Error(`Publisher ${input.publisherId} does not exist`);
      }

      return true;
    },

    unfollow: async (root, { input }: { input: FollowUnfollowInput }) => {
      const updateOperation = { $pull: { followerIds: input.followerId } };
      const updatedObj = await publishers
        .updateOne({ id: input.publisherId }, updateOperation);

      if (updatedObj.matchedCount === 0) {
        throw new Error(`Publisher ${input.publisherId} does not exist`);
      }

      return true;
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
