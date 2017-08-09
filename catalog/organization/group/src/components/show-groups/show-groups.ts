import {Widget, ClientBus} from "client-bus";
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
export class ShowGroupsComponent {
  groups: GroupAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.groups = [];
    this._groupService.getGroups()
      .then(groups => {
        this.groups = groups.map((group: GroupAtom) => {
          const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
          group_atom.atom_id = group.atom_id;
          group_atom.name = group.name;
          return group_atom;
        });
      });
  }
}
