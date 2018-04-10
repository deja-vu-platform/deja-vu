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

interface AuthorDoc {
  id: string;
}

interface TargetDoc {
  id: string;
}

interface CommentDoc {
  id: string;
  authorId?: string;
  targetId?: string;
  content?: string;
}

interface Author {
  id: string;
}

interface Target {
  id: string;
}

interface Comment {
  id: string;
  author: Author;
  target: Target;
  content: string;
}

interface CreateCommentInput {
  id: string;
  authorId: string;
  targetId: string;
  content: string;
}

interface EditCommentInput {
  id: string;
  authorId: string;
  content: string;
}

interface CommentsInput {
  authorId?: string;
  targetId?: string;
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

let db, authors, targets, comments;
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

    authors = db.collection('authors');
    authors.createIndex({ id: 1 }, { unique: true, sparse: true });
    targets = db.collection('targets');
    targets.createIndex({ id: 1 }, { unique: true, sparse: true });
    comments = db.collection('comments');
    comments.createIndex(
      { id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  // TODO: Check to see if author, target and comment already exists
  static async authorExists(id: string): Promise<AuthorDoc> {
    return Validation.exists(authors, id, 'Author');
  }

  static async targetExists(id: string): Promise<TargetDoc> {
    return Validation.exists(targets, id, 'Target');
  }

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

function commentDocToComment(commentDoc: CommentDoc): Comment {
  const ret = _.omit(commentDoc, ['authorId', 'targetId']);
  ret.author = { id: commentDoc.authorId };
  ret.target = { id: commentDoc.targetId };

  return ret;
}

const resolvers = {
  Query: {
    author: async (root, { id }) => {
      const author = await Validation.authorExists(id);

      return author;
    },
    target: async (root, { id }) => {
      const target = await Validation.targetExists(id);

      return target;
    },
    comment: async (root, { id }) => {
      const comment = await Validation.commentExists(id);

      return commentDocToComment(comment);
    },
    commentByAuthorTarget: (root, { authorId, targetId }) => {
      comments.findOne({ authorId: authorId, targetId: targetId });
    },
    comments: async (root, { input }: { input: CommentsInput }) => {
      const matchingComments: CommentDoc[] = await comments
        .find(input)
        .toArray();

      return _.map(matchingComments, commentDocToComment);
    }
  },

  Author: {
    id: (author: Author) => author.id
  },

  Target: {
    id: (target: Target) => target.id
  },

  Comment: {
    id: (comment: Comment) => comment.id,
    author: (comment: Comment) => comment.author,
    target: (comment: Comment) => comment.target,
    content: (comment: Comment) => comment.content
  },
  Mutation: {
    createAuthor: async (root, { id }) => {
      const authorId = id ? id : uuid();
      const author: AuthorDoc = { id: authorId };
      await authors.insertOne(author);

      return author;
    },

    createTarget: async (root, { id }) => {
      const targetId = id ? id : uuid();
      const target: TargetDoc = { id: targetId };
      await targets.insertOne(target);

      return target;
    },

    createComment: async (root, { input }: { input: CreateCommentInput }) => {
      await Promise.all([
        Validation.authorExists(input.authorId),
        Validation.targetExists(input.targetId)
      ]);

      const comment: CommentDoc = {
        id: input.id ? input.id : uuid(),
        authorId: input.authorId,
        targetId: input.targetId,
        content: input.content
      };

      await comments.insertOne(comment);

      return commentDocToComment(comment);
    },

    editComment: async (root, { input }
      : { input: EditCommentInput }) => {
      const [comment, author] = await Promise.all([
        Validation.commentExists(input.id),
        Validation.authorExists(input.authorId)
      ]);

      if (comment.authorId !== input.authorId) {
        throw new Error('Only the author of the comment can edit it.');
      }

      const updateOperation = { $set: { content: input.content } };

      const res = await comments
        .findAndUpdateOne({ id: input.id }, updateOperation);

      return res.value;
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
