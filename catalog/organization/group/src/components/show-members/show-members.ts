import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, NamedAtom} from "../../shared/data";
import {getMembers} from "../../shared/services";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowMembersComponent {
  members = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.members = [];
    getMembers(this._graphQlService)
      .then(members => members.map((member: Named) => {
        const member_atom = this._clientBus.new_atom<NamedAtom>("Member");
        member_atom.atom_id = member.atom_id;
        member_atom.name = member.name;
        return member_atom;
      }))
      .then(atom_members => this.members = atom_members);
  }
}
