import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  CommentDoc,
  CommentInput,
  CommentsInput,
  CreateCommentInput,
  DeleteCommentInput,
  EditCommentInput
} from './schema';

import { v4 as uuid } from 'uuid';


class CommentValidation {
  static async commentExistsOrFails(
    comments: mongodb.Collection<CommentDoc>, id: string): Promise<CommentDoc> {
    return Validation.existsOrFail(comments, id, 'Comment');
  }
}

const actionRequestTable: ActionRequestTable = {
  'create-comment': (extraInfo) => `
    mutation CreateComment($input: CreateCommentInput!) {
      createComment (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-comment': (extraInfo) => `
    mutation DeleteComment($input: DeleteCommentInput!) {
      deleteComment (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'edit-comment': (extraInfo) => {
    switch (extraInfo.action) {
      case 'edit':
        return `
          mutation EditComment($input: EditCommentInput!) {
            editComment (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Comment($id: ID!) {
            comment(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-comment': (extraInfo) => {
    switch (extraInfo.action) {
      case 'comment-by-id':
        return `
          query ShowComment($id: ID!) {
            comment(id: $id) ${getReturnFields(extraInfo)}
          }
      `;
      case 'comment-by-author':
        return `
          query ShowComment($input: CommentInput!) {
            commentByAuthorTarget(input: $input) ${getReturnFields(extraInfo)}
          }
      `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-comments': (extraInfo) => `
    query ShowComments($input: CommentsInput) {
      comments(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-comment-count': (extraInfo) => `
    query ShowCommentCount($input: CommentsInput) {
      commentCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function isPendingCreate(doc: CommentDoc | null) {
  return _.get(doc, 'pending.type') === 'create-comment';
}

function getCommentFilter(input: CommentsInput) {
  const filter = { pending: { $exists: false } };

  if (!_.isNil(input)) {
    if (input.byAuthorId) {
      // Comments by an author
      filter['authorId'] = input.byAuthorId;
    }
    if (input.ofTargetId) {
      // Comments of a target
      filter['targetId'] = input.ofTargetId;
    }
  }

  return filter;
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const comments: mongodb.Collection<CommentDoc> = db.collection('comments');

  return {
    Query: {
      comment: async (_root, { id }) => {
        const comment = await CommentValidation.commentExistsOrFails(
          comments, id);

        if (_.isNil(comment) || isPendingCreate(comment)) {
          throw new Error(`Comment ${id} not found`);
        }

        return comment;
      },

      commentByAuthorTarget: async (
        _root, { input }: { input: CommentInput }) => {
        const comment = await comments.findOne({
          authorId: input.byAuthorId, targetId: input.ofTargetId
        });

        if (_.isNil(comment) || isPendingCreate(comment)) {
          throw new Error(`Comment not found`);
        }

        return comment;
      },

      comments: async (_root, { input }: { input: CommentsInput }) => {
        return await comments.find(getCommentFilter(input))
          .toArray();
      },

      commentCount: (_root, { input }: { input: CommentsInput }) => {
        return comments.count(getCommentFilter(input));
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
        _root, { input }: { input: CreateCommentInput }, context: Context) => {
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

            return undefined;
          case 'abort':
            await comments.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return newComment;
      },

      editComment: async (
        _root, { input }: { input: EditCommentInput }, context: Context) => {
        const comment = await CommentValidation.commentExistsOrFails(
          comments, input.id);

        if (comment.authorId !== input.authorId) {
          throw new Error('Only the author of the comment can edit it.');
        }

        const updateOp = { $set: { content: input.content } };
        const notPendingCommentIdFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await CommentValidation.commentExistsOrFails(comments, input.id);
            const pendingUpdateObj = await comments
              .updateOne(
                notPendingCommentIdFilter,
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
            await CommentValidation.commentExistsOrFails(comments, input.id);
            const updateObj = await comments
              .updateOne(notPendingCommentIdFilter, updateOp);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return updateObj.modifiedCount === 1;
          case 'commit':
            await comments.updateOne(
              reqIdPendingFilter,
              { ...updateOp, $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await comments.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      },

      deleteComment: async (_root, { input }: { input: DeleteCommentInput },
        context: Context) => {
        const comment = await CommentValidation.commentExistsOrFails(
          comments, input.id);

        if (comment.authorId !== input.authorId) {
          throw new Error('Only the author of the comment can edit it.');
        }

        const notPendingCommentIdFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            await CommentValidation.commentExistsOrFails(comments, input.id);
            const pendingUpdateObj = await comments.updateOne(
              notPendingCommentIdFilter,
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'delete-comment'
                  }
                }
              });

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await CommentValidation.commentExistsOrFails(comments, input.id);
            const res = await comments
              .deleteOne(notPendingCommentIdFilter);

            if (res.deletedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await comments.deleteOne(reqIdPendingFilter);

            return undefined;
          case 'abort':
            await comments.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      }
    }
  };
}

const commentCliche: ClicheServer = new ClicheServerBuilder('comment')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const comments: mongodb.Collection<CommentDoc> = db.collection('comments');

    return comments.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

commentCliche.start();
