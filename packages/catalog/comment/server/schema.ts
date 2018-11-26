export interface CommentDoc {
  id: string;
  authorId: string;
  targetId: string;
  content: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-comment' | 'edit-comment' | 'delete-comment';
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
