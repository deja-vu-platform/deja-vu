import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {Named, NamedAtom, ParentAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowGroupsByChildComponent {
  @Field("Subgroup | Member") child: NamedAtom;
  groups = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.groups = [];
    if (this.child.atom_id) {
      this._groupService.getGroupsByChild(this.child.atom_id)
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
