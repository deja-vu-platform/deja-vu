import {Atom} from "client-bus";


export interface Post {
  atom_id: string;
  content: string;
  author: User;
}
export interface PostAtom extends Post, Atom {}

export interface User {
  atom_id: string;
  username: string;
}
export interface UserAtom extends User, Atom {}
