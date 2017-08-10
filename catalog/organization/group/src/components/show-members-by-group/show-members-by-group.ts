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
export class ShowMembersByGroupComponent {
  @Field("Group") group: GroupAtom;

  members: MemberAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (this.group.atom_id) {
      this._groupService.getMembersByGroup(this.group.atom_id)
        .then(members => {
          this.members = members.map((m) => {
            const member_atom = this._clientBus.new_atom<MemberAtom>("Member");
            member_atom.atom_id = m.atom_id;
            member_atom.name = m.name;
            return member_atom;
          });
        });
    }
  }
}
