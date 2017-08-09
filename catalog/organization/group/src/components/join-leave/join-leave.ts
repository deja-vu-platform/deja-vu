import {Widget, Field, AfterInit, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Member, Group, MemberAtom, GroupAtom} from "../_shared/data";
import {filterInPlace} from "../_shared/utils";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class JoinLeaveComponent implements AfterInit {
  @Field("Member") member: MemberAtom;
  @Field("Group") group: GroupAtom;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this._groupService.getMembersByGroup(this.group.atom_id)
      .then(members => {
        this.group.members = members.map(member => {
          const member_atom = this._clientBus.new_atom<MemberAtom>("Member");
          member_atom.atom_id = member.atom_id;
          member_atom.name = member.name;
          return member_atom;
        });
      });
  }

  joinGroup() {
    this._groupService.addMemberToGroup(
      this.group.atom_id,
      this.member.atom_id
    )
      .then(success => {
        if (success) {
          this.group.members.push(this.member);
        }
      });
  }

  leaveGroup() {
    this._groupService.removeMemberFromGroup(
      this.group.atom_id,
      this.member.atom_id
    )
      .then(success => {
        if (success) {
          filterInPlace(this.group.members, m => {
            return m.atom_id !== this.member.atom_id;
          });
        }
      });
  }

  // called from template to update button text
  inGroup(member: Member, group: Group): boolean {
    return group.members.findIndex(m => m.atom_id === member.atom_id) >= 0;
  }
}
