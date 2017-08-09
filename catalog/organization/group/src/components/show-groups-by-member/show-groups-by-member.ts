import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowGroupsByMemberComponent {
  @Field("Member") member: MemberAtom;
  groups: GroupAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.groups = [];
    if (this.member.atom_id) {
      this._groupService.getGroupsByMember(this.member.atom_id)
        .then(groups => {
          this.groups = groups.map((group: GroupAtom) => {
            const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
            group_atom.atom_id = group.atom_id;
            group_atom.name = group.name;
            return group_atom;
          });
        });
    }
  }
}
