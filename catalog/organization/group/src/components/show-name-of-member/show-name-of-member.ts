import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowNameOfMemberComponent {
  @Field("Member") member: MemberAtom;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.member.atom_id && !this.member.name) {
      this._groupService.getNameOfMember(this.member.atom_id)
        .then(name => this.member.name = name);
    }
  }
}
