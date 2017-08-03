import {Atom} from "client-bus";

export interface Member {
  atom_id: string;
  name: string;
}
export interface MemberAtom extends Member, Atom {}

export interface Group {
  atom_id: string;
  name: string;
  members?: Member[];
  subgroups?: Group[];
}
export interface GroupAtom extends Group, Atom {}
