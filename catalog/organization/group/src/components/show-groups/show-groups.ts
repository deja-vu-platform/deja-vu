import {Widget} from "client-bus";
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
export class ShowGroupsComponent {
  groups: GroupAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.groups = [];
    this._groupService.getGroups()
      .then(groups => {
        this.groups = groups.map((group: GroupAtom) => {
          return this._atomize.atomizeGroup(group);
        });
      });
  }
}
