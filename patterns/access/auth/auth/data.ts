export type Username = string;
export type Password = string;
export type Resource = string;

export interface User {
  username: Username;
  password: Password;
  read: Resource[];
  write: Resource[];
}

export interface LoggedInUser extends User {}

