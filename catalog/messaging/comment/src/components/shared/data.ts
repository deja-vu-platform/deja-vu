import {Atom} from "client-bus";


export interface TargetAtom extends Atom { name: string; }

export interface Author {
  atom_id: string;
  name: string;
}
export interface AuthorAtom extends Author, Atom {}

export interface Comment {
  atom_id: string;
  content: string;
  author: Author;
}
export interface CommentAtom extends Atom {
  content: string;
  author: AuthorAtom;
}
