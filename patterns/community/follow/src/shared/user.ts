export type Username = string;

export interface User {
  username: Username;
  follows: User[];
}
