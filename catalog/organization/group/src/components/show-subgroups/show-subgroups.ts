import {Widget, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Named, ParentAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowSubroupsComponent {
  subgroups = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.subgroups = [];
    this._groupService.getSubgroups()
      .then(subgroups => subgroups.map((subgroup: Named) => {
        const subgroup_atom = this._clientBus.new_atom<ParentAtom>("Subgroup");
        subgroup_atom.atom_id = subgroup.atom_id;
        subgroup_atom.name = subgroup.name;
        return subgroup_atom;
      }))
      .then(atom_subgroups => this.subgroups = atom_subgroups);
  }
}
