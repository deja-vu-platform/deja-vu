type Username = string;
type Message = string;

export interface User {
  id: Username;
  can_read: Message[];
  authors: Message[];
  friends: User[];
}
