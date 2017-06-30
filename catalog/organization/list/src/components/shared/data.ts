import {Atom} from "client-bus";

export interface List {
  atom_id: string;
  name: string;
  items: Item[];
}
export interface ListAtom extends List, Atom {}

export interface Item {
  atom_id: string;
  name: string;
  checked: boolean;
}
export interface ItemAtom extends Item, Atom {}
