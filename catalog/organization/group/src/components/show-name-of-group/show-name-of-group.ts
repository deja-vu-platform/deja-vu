import {Widget, Field} from "client-bus";
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
export class ShowNameOfGroupComponent {
  @Field("Group") group: GroupAtom;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.group.atom_id && !this.group.name) {
      this._groupService.getNameOfGroup(this.group.atom_id)
        .then(name => this.group.name = name);
    }
  }
}
