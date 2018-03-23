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

  private fetched: string;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.member.atom_id && !this.member.name) {
      this.fetch();
    } else {
      this.fetched = this.member.atom_id;
    }

    this.member.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.member.atom_id) {
      this.fetched = this.member.atom_id;
      if (this.member.atom_id) {
        this.getName();
      } else {
        this.member.name = "";
      }
    }
  }

  private getName() {
    this._groupService.getNameOfMember(this.member.atom_id)
      .then(name => this.member.name = name);
  }
}
