import {Atom} from "client-bus";
import {Member, Group} from "../../_shared/data";

export interface Member extends Member {};
export interface Group extends Group {};

export interface MemberAtom extends Member, Atom {}

export interface GroupAtom extends Group, Atom {
  members: MemberAtom[];
  subgroups: GroupAtom[];
}
