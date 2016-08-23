export type Username = string;
export type Content = string;

export interface Post {
  atom_id?: string;
  content: Content;
}

export interface User {
  username: Username;
  posts: Post[];
}
