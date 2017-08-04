import {Atom} from "client-bus";

export interface Named {
  atom_id: string;
  name: string;
}
export interface NamedAtom extends Named, Atom {}

export interface Parent extends Named {
  members?: Named[];
  subgroups?: Parent[];
}
export interface ParentAtom extends Named, Atom {
  members?: NamedAtom[];
  subgroups?: ParentAtom[];
}
