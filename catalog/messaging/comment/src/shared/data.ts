import {Atom} from "client-bus";

export interface Target {}
export interface TargetAtom extends Target, Atom {}

export interface Author {
  name: string;
}
export interface AuthorAtom extends Author, Atom {}

export interface Comment {
  atom_id: string;
  content: string;
  author: AuthorAtom;
  target: TargetAtom;
}
export interface CommentAtom extends Comment, Atom {}
