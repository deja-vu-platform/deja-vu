import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {Named, NamedAtom, ParentAtom} from "../../shared/data";
import {getGroupsByChild} from "../../shared/services";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupsByChildComponent {
  @Field("Subgroup | Member") child: NamedAtom;
  groups = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.groups = [];
    if (this.child.atom_id) {
      getGroupsByChild(this._graphQlService, this.child.atom_id)
        .then(groups => groups.map((group: Named) => {
          const group_atom = this._clientBus.new_atom<ParentAtom>("Group");
          group_atom.atom_id = group.atom_id;
          group_atom.name = group.name;
          return group_atom;
        }))
        .then(atom_groups => this.groups = atom_groups);
    }
  }
}
