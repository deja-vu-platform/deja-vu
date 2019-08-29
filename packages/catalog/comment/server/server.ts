import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/concept-server';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import {
  CommentDoc,
  CommentInput,
  CommentsInput,
  CreateCommentInput,
  DeleteCommentInput,
  EditCommentInput
} from './schema';

import { v4 as uuid } from 'uuid';


interface CommentConfig extends Config {
  /* Whether only authors can edit/delete their own comments or not */
  onlyAuthorCanEdit?: boolean;
}

class CommentValidation {
  static async commentExistsOrFails(
    comments: Collection<CommentDoc>, id: string): Promise<CommentDoc> {
    return Validation.existsOrFail(comments, id, 'Comment');
  }
}

const componentRequestTable: ComponentRequestTable = {
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
    query ShowComments($input: CommentsInput!) {
      comments(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-comment-count': (extraInfo) => `
    query ShowCommentCount($input: CommentsInput!) {
      commentCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function addTimestamp(comment: CommentDoc | null) {
  if (comment === null) {
    return null;
  }
  comment['timestamp'] = new Date(comment._id.getTimestamp())
    .getTime();

  return comment;
}

function resolvers(db: ConceptDb, config: CommentConfig): IResolvers {
  const comments: Collection<CommentDoc> = db.collection('comments');

  return {
    Query: {
      comment: async (_root, { id }) => addTimestamp(
        await comments.findOne({ id })),

      commentByAuthorTarget: async (
        _root, { input }: { input: CommentInput }) => addTimestamp(
          await comments.findOne({
            authorId: input.byAuthorId, targetId: input.ofTargetId
          })),

      comments: async (_root, { input }: { input: CommentsInput }) => {
        const filter = {};
        if (!_.isEmpty(input.byAuthorId)) {
          // Comments by an author
          filter['authorId'] = input.byAuthorId;
        }
        if (!_.isEmpty(input.ofTargetId)) {
          // Comments of a target
          filter['targetId'] = input.ofTargetId;
        }

        return _.map(await comments.find(filter), addTimestamp);
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

        return await comments.insertOne(context, newComment);
      },

      editComment: async (
        _root, { input }: { input: EditCommentInput }, context: Context) => {
          if (config.onlyAuthorCanEdit) {
            const comment = await CommentValidation.commentExistsOrFails(
              comments, input.id);
            // IMPORTANT: No explicit transaction logic here to make this atomic
            // only because Comment authorIds CANNOT be changed.
            // If for some reason editing Comment authorIds becomes possible,
            // this functionality will be broken.
            // Note that the authorization concept could also be used
            // to get the same functionality.
            if (comment.authorId !== input.authorId) {
              throw new Error('Only the author of the comment can edit it.');
            }
          }

        const updateOp = { $set: { content: input.content } };

        return await comments.updateOne(context, { id: input.id }, updateOp);
      },

      deleteComment: async (
        _root, { input }: { input: DeleteCommentInput }, context: Context) => {
        if (config.onlyAuthorCanEdit) {
          const comment = await CommentValidation.commentExistsOrFails(
            comments, input.id);
          // the IMPORTANT note in editComment also applies
          if (comment.authorId !== input.authorId) {
            throw new Error('Only the author of the comment can delete it.');
          }
        }

        return await comments.deleteOne(context, { id: input.id });
      }
    }
  };
}

const commentConcept: ConceptServer = new ConceptServerBuilder('comment')
  .initDb((db: ConceptDb, _config: CommentConfig): Promise<any> => {
    const comments: Collection<CommentDoc> = db.collection('comments');

    return comments.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

commentConcept.start();
