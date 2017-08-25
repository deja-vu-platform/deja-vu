import {Atom} from "client-bus";

export interface Checklist {
  atom_id: string;
  name: string;
  items: Item[];
}
export interface ChecklistAtom extends Checklist, Atom {}

export interface Item {
  atom_id: string;
  name: string;
  checked: boolean;
}
export interface ItemAtom extends Item, Atom {}
