import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {NamedAtom, ParentAtom} from "../../shared/data";
import {getMembersByParent} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowMembersByParentComponent {
  @Field("Group | Subgroup") parent: ParentAtom;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (
      this.parent.atom_id &&
      (!this.parent.members || !this.parent.members.length)
    ) {
      getMembersByParent(this._graphQlService, this.parent.atom_id)
        .then(members => members.map((m) => {
          const member_atom = this._clientBus.new_atom<NamedAtom>("Member");
          member_atom.atom_id = m.atom_id;
          member_atom.name = m.name;
          return member_atom;
        }))
        .then(atom_members => this.parent.members = atom_members);
    }
  }
}
