import {Injectable} from "@angular/core";

import {ClientBus, isAtom} from "client-bus";

import {Member, MemberAtom, Group, GroupAtom} from "./data";


@Injectable()
export default class Atomize {
  constructor(private _clientBus: ClientBus) {}

  atomizeMember(member: Member): MemberAtom {
    const member_atom = this._clientBus.new_atom<MemberAtom>("Member");
    member_atom.atom_id = member.atom_id;
    member_atom.name = member.name;
    return member_atom;
  }

  atomizeGroup(group: Group): GroupAtom {
    const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
    group_atom.atom_id = group.atom_id;
    group_atom.name = group.name;
    if (group.members) {
      group_atom.members = group.members.map(member => {
        if (isAtom(member)) {
          return member as MemberAtom;
        } else {
          return this.atomizeMember(member);
        }
      });
    } else {
      group_atom.members = [];
    }
    if (group.subgroups) {
      group_atom.subgroups = group.subgroups.map(group => {
        if (isAtom(group)) {
          return group as GroupAtom;
        } else {
          return this.atomizeGroup(group);
        }
      });
    } else {
      group_atom.subgroups = [];
    }
    return group_atom;
  }
}
