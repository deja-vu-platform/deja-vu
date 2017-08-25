import {Widget} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {MemberAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class ShowMembersComponent {
  members: MemberAtom[] = [];

  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.members = [];
    this._groupService.getMembers()
      .then(members => {
        this.members = members.map(member => {
          return this._atomize.atomizeMember(member);
        });
      });
  }
}
