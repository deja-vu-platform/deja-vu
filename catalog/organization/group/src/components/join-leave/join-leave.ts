import {Widget, Field, AfterInit} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {Member, Group, MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";
import {filterInPlace} from "../_shared/utils";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class JoinLeaveComponent implements AfterInit {
  @Field("Member") member: MemberAtom;
  @Field("Group") group: GroupAtom;

  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    if (
      this.group.atom_id &&
      (!this.group.members || this.group.members.length === 0)
    ) {
      this.group.members = [];
      this.fetch();
    } else {
      this.fetched = this.group.atom_id;
    }

    this.group.on_change(() => this.fetch());
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

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      if (this.group.atom_id) {
        this.getMembers();
      } else {
        this.group.members = [];
      }
    }
  }

  private getMembers() {
    this._groupService.getMembersByGroup(this.group.atom_id)
      .then(members => {
        this.group.members = members.map(member => {
          return this._atomize.atomizeMember(member);
        });
      });
  }
}
