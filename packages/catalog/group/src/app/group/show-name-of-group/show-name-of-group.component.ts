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

  private fetched: string;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.group.atom_id && !this.group.name) {
      this.fetch();
    } else {
      this.fetched = this.group.atom_id;
    }

    this.group.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      if (this.group.atom_id) {
        this.getName();
      } else {
        this.group.name = "";
      }
    }
  }

  private getName() {
    this._groupService.getNameOfGroup(this.group.atom_id)
      .then(name => this.group.name = name);
  }
}
