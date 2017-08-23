import {Atom} from "client-bus";

import {Label, Item} from "../../_shared/data";
export interface Label extends Label {}
export interface Item extends Item {}

export interface LabelAtom extends Label, Atom {
  items: ItemAtom[];
}

export interface ItemAtom extends Item, Atom {
  labels: LabelAtom[];
}

// TODO: Remove once array fields work
export interface ItemArrAtom extends Atom {
  arr: ItemAtom[];
}
