export type Username = string;
export type Content = string;

export interface Post {
  content: Content;
}

export interface User {
  username: Username;
  posts: Post[];
}
