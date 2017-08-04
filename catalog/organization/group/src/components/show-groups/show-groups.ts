import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, ParentAtom} from "../../shared/data";
import {getGroups} from "../../shared/services";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupsComponent {
  groups = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.groups = [];
    getGroups(this._graphQlService)
      .then(groups => groups.map((group: Named) => {
        const group_atom = this._clientBus.new_atom<ParentAtom>("Group");
        group_atom.atom_id = group.atom_id;
        group_atom.name = group.name;
        return group_atom;
      }))
      .then(atom_groups => this.groups = atom_groups);
  }
}
