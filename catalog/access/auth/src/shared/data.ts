export type Username = string;
export type Password = string;
export type Resource = string;
export type AtomId = string;

export interface User {
  username: Username;
  password: Password;
  atom_id: AtomId;
}

export interface LoggedInUser extends User {}

