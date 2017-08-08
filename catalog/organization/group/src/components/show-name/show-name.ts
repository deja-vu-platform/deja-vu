import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {NamedAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowNameComponent {
  @Field("Group | Subgroup | Member") named: NamedAtom;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.named.atom_id && !this.named.name) {
      this._groupService.getName(this.named.atom_id)
        .then(name => this.named.name = name);
    }
  }
}
