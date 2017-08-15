import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class ShowSubgroupsOfGroupComponent {
  @Field("Group") group: GroupAtom;

  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    if (
      this.group.atom_id &&
      (!this.group.subgroups || this.group.subgroups.length === 0)
    ) {
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
        this.getSubgroups();
      } else {
        this.group.subgroups = [];
      }
    }
  }

  private getSubgroups() {
    this._groupService.getSubgroupsOfGroup(this.group.atom_id)
      .then(subgroups => {
        this.group.subgroups = subgroups.map((group) => {
          return this._atomize.atomizeGroup(group);
        });
      });
  }
}
