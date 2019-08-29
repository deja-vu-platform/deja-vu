export interface CommentDoc {
  _id?: any;
  id: string;
  authorId: string;
  targetId: string;
  content: string;
}

export interface CreateCommentInput {
  id?: string;
  authorId: string;
  targetId: string;
  content: string;
}

export interface EditCommentInput {
  id: string;
  authorId: string;
  content: string;
}

export interface DeleteCommentInput {
  id: string;
  authorId: string;
}

export interface CommentInput {
  byAuthorId: string;
  ofTargetId: string;
}

export interface CommentsInput {
  byAuthorId?: string;
  ofTargetId?: string;
}
