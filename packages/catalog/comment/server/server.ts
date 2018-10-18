import {
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  Validation
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  CommentDoc,
  CommentInput,
  CommentsInput,
  CreateCommentInput,
  EditCommentInput,
  PendingDoc
} from './schema';
import { v4 as uuid } from 'uuid';


class CommentValidation {
  static async commentExistsOrFails(
    comments: mongodb.Collection<CommentDoc>, id: string): Promise<CommentDoc> {
    return Validation.existsOrFail(comments, id, 'Comment');
  }
}

function isPendingCreate(doc: CommentDoc | null) {
  return _.get(doc, 'pending.type') === 'create-comment';
}

function resolvers(db: mongodb.Db, config: Config): object {
  const comments: mongodb.Collection<CommentDoc> = db.collection('comments');
  return {
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
};

const commentCliche: ClicheServer = new ClicheServerBuilder('comment')
  .initDb((db: mongodb.Db, config: Config): Promise<any> => {
    const comments: mongodb.Collection<CommentDoc> = db.collection('comments');
    return comments.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .resolvers(resolvers)
  .build();

commentCliche.start();
