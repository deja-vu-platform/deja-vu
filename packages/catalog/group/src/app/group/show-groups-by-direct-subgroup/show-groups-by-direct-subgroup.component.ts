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
export class ShowGroupsByDirectSubgroupComponent {
  @Field("Group") group: GroupAtom;

  groups: GroupAtom[] = [];

  private fetched: string;


  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.fetch();
    this.group.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      if (this.group.atom_id) {
        this.getGroups();
      } else {
        this.groups = [];
      }
    }
  }

  private getGroups() {
    this._groupService.getGroupsByDirectSubgroup(this.group.atom_id)
      .then(groups => {
        this.groups = groups.map((group: GroupAtom) => {
          return this._atomize.atomizeGroup(group);
        });
      });
  }
}
