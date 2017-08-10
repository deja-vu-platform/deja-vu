import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowSubgroupsOfGroupComponent {
  @Field("Group") group: GroupAtom;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (this.group.atom_id) {
      this._groupService.getSubgroupsOfGroup(this.group.atom_id)
        .then(subgroups => {
          this.group.subgroups = subgroups.map((g) => {
            const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
            group_atom.atom_id = g.atom_id;
            group_atom.name = g.name;
            return group_atom;
          });
        });
    }
  }
}
