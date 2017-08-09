import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowMembersComponent {
  members: MemberAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.members = [];
    this._groupService.getMembers()
      .then(members => {
        this.members = members.map(member => {
          const member_atom = this._clientBus.new_atom<MemberAtom>("Member");
          member_atom.atom_id = member.atom_id;
          member_atom.name = member.name;
          return member_atom;
        });
      });
  }
}
