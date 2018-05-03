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

interface CommentDoc {
  id: string;
  authorId: string;
  targetId: string;
  content: string;
}

interface CreateCommentInput {
  id?: string;
  authorId: string;
  targetId: string;
  content: string;
}

interface EditCommentInput {
  id: string;
  authorId: string;
  content: string;
}

interface CommentInput {
  byAuthorId: string;
  ofTargetId: string;
}

interface CommentsInput {
  byAuthorId?: string;
  ofTargetId?: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'comment';

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
let comments: mongodb.Collection<CommentDoc>;
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

    comments = db.collection('comments');
    comments.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {

  static async commentExists(id: string): Promise<CommentDoc> {
    return Validation.exists(comments, id, 'Comment');
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
    comment: async (root, { id }) => {
      const comment = await comments.findOne({ id: id });

      if (_.isEmpty(comment)) {
        throw new Error(`Comment ${id} not found`);
      }

      return comment;
    },

    commentByAuthorTarget: async (root, { input }: { input: CommentInput }) => {
      const comment = await comments.findOne({
        authorId: input.byAuthorId, targetId: input.ofTargetId
      });

      if (_.isEmpty(comment)) {
        throw new Error(`Comment not found`);
      }

      return comment;
    },

    comments: async (root, { input }: { input: CommentsInput }) => {
      const filter = {};
      if (!_.isEmpty(input.byAuthorId)) {
        // Comments by an author
        filter['authorId'] = input.byAuthorId;
      }
      if (!_.isEmpty(input.ofTargetId)) {
        // Comments of a target
        filter['targetId'] = input.ofTargetId;
      }

      return comments.find(filter)
        .toArray();

    }
  },

  Comment: {
    id: (comment: CommentDoc) => comment.id,
    authorId: (comment: CommentDoc) => comment.authorId,
    targetId: (comment: CommentDoc) => comment.targetId,
    content: (comment: CommentDoc) => comment.content
  },

  Mutation: {
    createComment: async (root, { input }: { input: CreateCommentInput }) => {
      const comment: CommentDoc = {
        id: input.id ? input.id : uuid(),
        authorId: input.authorId,
        targetId: input.targetId,
        content: input.content
      };
      await comments.insertOne(comment);

      return comment;
    },

    editComment: async (root, { input }: { input: EditCommentInput }) => {
      const comment = await Validation.commentExists(input.id);

      if (comment.authorId !== input.authorId) {
        throw new Error('Only the author of the comment can edit it.');
      }

      const updateOperation = { $set: { content: input.content } };

      const res = await comments.updateOne({ id: input.id }, updateOperation);

      return res.modifiedCount === 1;
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
