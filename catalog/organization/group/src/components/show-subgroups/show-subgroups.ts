import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, ParentAtom} from "../../shared/data";
import {getSubgroups} from "../../shared/services";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowSubroupsComponent {
  subgroups = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.subgroups = [];
    getSubgroups(this._graphQlService)
      .then(subgroups => subgroups.map((subgroup: Named) => {
        const subgroup_atom = this._clientBus.new_atom<ParentAtom>("Subgroup");
        subgroup_atom.atom_id = subgroup.atom_id;
        subgroup_atom.name = subgroup.name;
        return subgroup_atom;
      }))
      .then(atom_subgroups => this.subgroups = atom_subgroups);
  }
}
