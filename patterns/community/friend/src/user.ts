export type Username = string;
export type Message = string;

export interface User {
  username: Username;
  can_read: Message[];
  authors: Message[];
  friends: User[];
}
