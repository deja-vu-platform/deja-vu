import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, NamedAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowMembersComponent {
  members = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.members = [];
    this._groupService.getMembers()
      .then(members => members.map((member: Named) => {
        const member_atom = this._clientBus.new_atom<NamedAtom>("Member");
        member_atom.atom_id = member.atom_id;
        member_atom.name = member.name;
        return member_atom;
      }))
      .then(atom_members => this.members = atom_members);
  }
}
