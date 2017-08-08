import {Widget, Field, AfterInit, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, NamedAtom, ParentAtom} from "../../shared/data";
import {filterInPlace} from "../../shared/utils";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class JoinLeaveComponent implements AfterInit {
  @Field("Member") member: NamedAtom;
  @Field("Group | Subgroup") parent: ParentAtom;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.parent.members = [];
    this._groupService.getMembersByParent(this.parent.atom_id)
      .then(members => members.forEach((member: Named) => {
        const memberAtom = this._clientBus.new_atom<NamedAtom>("Member");
        memberAtom.atom_id = member.atom_id;
        memberAtom.name = member.name;
        this.parent.members.push(memberAtom);
      }));
  }

  joinGroup() {
    this._groupService.addMemberToParent(
      this.parent.atom_id,
      this.member.atom_id
    )
      .then(success => {
        if (success) {
          this.parent.members.push(this.member);
        }
      });
  }

  leaveGroup() {
    this._groupService.removeMemberFromParent(
      this.parent.atom_id,
      this.member.atom_id
    )
      .then(success => {
        if (success) {
          filterInPlace(this.parent.members, m => {
            return m.atom_id !== this.member.atom_id;
          });
        }
      });
  }

  // called from template to update button text
  inGroup(member: NamedAtom, group: ParentAtom): boolean {
    return group.members.findIndex(m => m.atom_id === member.atom_id) >= 0;
  }
}
