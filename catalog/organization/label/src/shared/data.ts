import {Atom} from "client-bus";

export interface Label {
  atom_id: string;
  name: string;
  items: Item[];
}
export interface LabelAtom extends Label, Atom {}

export interface Item {
  atom_id: string;
  name: string;
  labels: Label[];
}
export interface ItemAtom extends Item, Atom {}

export interface ItemArr {
  arr: Item[];
}
export interface ItemArrAtom extends ItemArr, Atom {}
