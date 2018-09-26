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
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-comment' | 'edit-comment';
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

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

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
  static async commentExistsOrFails(id: string): Promise<CommentDoc> {
    const comment: CommentDoc | null = await comments
      .findOne({ id: id });
    if (_.isNil(comment)) {
      throw new Error(`Comment ${id} not found`);
    }

    return comment!;
  }
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: CommentDoc | null) {
  return _.get(doc, 'pending.type') === 'create-comment';
}

const resolvers = {
  Query: {
    comment: async (root, { id }) => {
      const comment = await Validation.commentExistsOrFails(id);

      if (_.isNil(comment) || isPendingCreate(comment)) {
        throw new Error(`Comment ${id} not found`);
      }

      return comment;
    },

    commentByAuthorTarget: async (root, { input }: { input: CommentInput }) => {
      const comment = await comments.findOne({
        authorId: input.byAuthorId, targetId: input.ofTargetId
      });

      if (_.isNil(comment) || isPendingCreate(comment)) {
        throw new Error(`Comment not found`);
      }

      return comment;
    },

    comments: async (root, { input }: { input: CommentsInput }) => {
      const filter = { pending: { $exists: false } };
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
    createComment: async (
      root, { input }: { input: CreateCommentInput }, context: Context) => {
      const newComment: CommentDoc = {
        id: input.id ? input.id : uuid(),
        authorId: input.authorId,
        targetId: input.targetId,
        content: input.content
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          newComment.pending = {
            reqId: context.reqId,
            type: 'create-comment'
          };
        /* falls through */
        case undefined:
          await comments.insertOne(newComment);

          return newComment;
        case 'commit':
          await comments.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await comments.deleteOne(reqIdPendingFilter);

          return;
      }

      return newComment;
    },

    editComment: async (
      root, { input }: { input: EditCommentInput }, context: Context) => {
      const comment = await Validation.commentExistsOrFails(input.id);

      if (comment.authorId !== input.authorId) {
        throw new Error('Only the author of the comment can edit it.');
      }

      const updateOp = { $set: { content: input.content } };
      const notPendingResourceFilter = {
        id: input.id,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          await Validation.commentExistsOrFails(input.id);
          const pendingUpdateObj = await comments
            .updateOne(
              notPendingResourceFilter,
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'edit-comment'
                  }
                }
              });
          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case undefined:
          await Validation.commentExistsOrFails(input.id);
          const updateObj = await comments
            .updateOne(notPendingResourceFilter, updateOp);
          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return updateObj.modifiedCount === 1;
        case 'commit':
          await comments.updateOne(
            reqIdPendingFilter,
            { ...updateOp, $unset: { pending: '' } });

          return;
        case 'abort':
          await comments.updateOne(
            reqIdPendingFilter, { $unset: { pending: '' } });

          return;
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
