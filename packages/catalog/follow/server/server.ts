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

interface FollowerDoc {
  id: string;
  publisherIds?: string[];
}

interface PublisherDoc {
  id: string;
  messageIds?: string[];
}

interface MessageDoc {
  id: string;
  publisherId: string;
  content: string;
}

interface CreateMessageInput {
  id?: string;
  publisherId: string;
  content: string;
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
let followers: mongodb.Collection<FollowerDoc>;
let publishers: mongodb.Collection<PublisherDoc>;
let messages: mongodb.Collection<MessageDoc>;
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
    followers = db.collection('followers');
    followers.createIndex({ id: 1 }, { unique: true, sparse: true });
    publishers = db.collection('publishers');
    publishers.createIndex({ id: 1 }, { unique: true, sparse: true });
    messages = db.collection('messages');
    messages.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async followerExists(id: string) {
    return Validation.exists(followers, id, 'Follower');
  }

  static async publisherExists(id: string) {
    return Validation.exists(publishers, id, 'Publisher');
  }

  static async messageExists(id: string) {
    return Validation.exists(messages, id, 'Message');
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }
}

const resolvers = {
  Query: {
    follower: (root, { id }) => followers.findOne({ id: id }),

    publisher: (root, { id }) => publishers.findOne({ id: id }),

    message: (root, { id }) => messages.findOne({ id: id }),

    followers: async (root, { publisherId }) => {
      if (publisherId) {
        await Validation.publisherExists(publisherId);

        return followers
          .find({ publisherIds: publisherId })
          .toArray();
      }

      // No follower filter
      return followers.find()
        .toArray();
    },

    publishers: async (root, { followerId }) => {
      if (followerId) {
        const follower = await Validation.followerExists(followerId);
        const publisherIds = follower.publisherIds;

        if (_.isEmpty(publisherIds)) { return []; }

        return publishers
          .find({ id: { $in: publisherIds } })
          .toArray();
      }

      // No publisher filter
      return publishers.find()
        .toArray();
    },

    messages: async (root, { input }: { input: MessagesInput }) => {
      if (input.publisherId) {
        // Get messages by a specific publisher
        const publisher = await Validation.publisherExists(input.publisherId);

        return messages.find({ publisherId: input.publisherId })
          .toArray();

      } else if (input.followerId) {
        // Gets messages of all the publishers followed by a follower
        const follower = await Validation.followerExists(input.followerId);

        return messages
          .find({ publisherId: { $in: follower.publisherIds } })
          .toArray();

      } else {
        // No message filter
        return messages.find()
          .toArray();
      }
    },

    isFollowing: async (root, { input }: { input: FollowUnfollowInput }) => {
      const [follower, publisher] = await Promise.all([
        Validation.followerExists(input.followerId),
        Validation.publisherExists(input.publisherId)
      ]);

      if (!_.isEmpty(follower.publisherIds)) {
        const publisherIndex = _
          .indexOf(follower.publisherIds, input.publisherId);

        return (publisherIndex > -1);
      }

      return false;
    }

  },
  Follower: {
    id: (follower: FollowerDoc) => follower.id,
    follows: (follower: FollowerDoc) => {
      if (_.isEmpty(follower.publisherIds)) { return []; }

      return publishers
        .find({ id: { $in: follower.publisherIds } })
        .toArray();
    },

    Publisher: {
      id: (publisher: PublisherDoc) => publisher.id,
      messages: (publisher: PublisherDoc) => {
        return messages
          .find({ publisherId: publisher.id })
          .toArray();
      }
    },

    Message: {
      id: (message: MessageDoc) => message.id,
      publisher: (message: MessageDoc) => {
        return publishers.findOne({ id: message.publisherId });
      },
      content: (message: MessageDoc) => message.content
    }
  },
  Mutation: {
    createFollower: async (root, { id }) => {
      const followerId = id ? id : uuid();
      const newFollower: FollowerDoc = { id: followerId };
      await followers.insertOne(newFollower);

      return newFollower;
    },

    createPublisher: async (root, { id }) => {
      const publisherId = id ? id : uuid();
      const newPublisher: PublisherDoc = { id: publisherId };
      await publishers.insertOne(newPublisher);

      return newPublisher;
    },

    createMessage: async (root, { input }: { input: CreateMessageInput }) => {
      const messageId = input.id ? input.id : uuid();
      const newMessage: MessageDoc = {
        id: messageId,
        publisherId: input.publisherId,
        content: input.content
      };
      await messages.insertOne(newMessage);

      return newMessage;
    },

    editFollower: async (root, { input }: { input: EditFollowerInput }) => {
      // Alternatively: delete doc and add new one
      // TODO: throw error if old == new?

      await Validation.followerExists(input.oldId);
      const updateOperation = { $set: { id: input.newId } };
      await followers.findOneAndUpdate({ id: input.oldId }, updateOperation);

      return true;
    },

    editPublisher: async (root, { input }: { input: EditPublisherInput }) => {
      await Validation.publisherExists(input.oldId);

      // TODO: throw error if old == new?

      // Update publisherIds of Followers
      const publisherUpdate = {
        $pull: { publisherIds: { id: input.oldId } },
        $push: { publisherIds: { id: input.newId } }
      };
      await followers
        .updateMany({ publisherIds: input.oldId }, publisherUpdate);

      // Update messages db
      const msgUpdateOperation = { $set: { publisherId: input.newId } };
      await messages
        .updateMany({ publisherId: input.oldId }, msgUpdateOperation);

      // Update publishers db
      const updateOperation = { $set: { id: input.newId } };
      await publishers.findOneAndUpdate({ id: input.oldId }, updateOperation);

      return true;
    },

    editMessage: async (root, { input }: { input: EditMessageInput }) => {
      const [message, publisher] = await Promise.all([
        Validation.messageExists(input.id),
        Validation.publisherExists(input.publisherId)
      ]);

      if (message.publisherId !== input.publisherId) {
        throw new Error('Only the publisher of the message can edit it.');
      }

      const updateOperation = { $set: { content: input.content } };
      await messages.findOneAndUpdate({ id: input.id }, updateOperation);

      return true;
    },

    follow: async (root, { input }: { input: FollowUnfollowInput }) => {
      await Promise.all([
        Validation.followerExists(input.followerId),
        Validation.publisherExists(input.publisherId)
      ]);

      const updateOperation = { $push: { follows: { id: input.publisherId } } };
      await followers
        .findOneAndUpdate({ id: input.followerId }, updateOperation);
    },

    unfollow: async (root, { input }: { input: FollowUnfollowInput }) => {
      await Promise.all([
        Validation.followerExists(input.followerId),
        Validation.publisherExists(input.publisherId)
      ]);

      const updateOperation = { $pull: { follows: { id: input.publisherId } } };
      await followers
        .findOneAndUpdate({ id: input.followerId }, updateOperation);
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
