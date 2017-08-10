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
export class ShowSubgroupsByGroupComponent {
  @Field("Group") group: GroupAtom;

  subgroups: GroupAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (this.group.atom_id) {
      this._groupService.getSubgroupsByGroup(this.group.atom_id)
        .then(subgroups => {
          this.subgroups = subgroups.map((g) => {
            const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
            group_atom.atom_id = g.atom_id;
            group_atom.name = g.name;
            return group_atom;
          });
        });
    }
  }
}
