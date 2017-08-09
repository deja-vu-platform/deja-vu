import {Widget, Field, PrimitiveAtom} from "client-bus";
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
export class EditNameOfMemberComponent {
  @Field("Member") member: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  req: Promise<boolean> = null;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.member.atom_id && !this.member.name) {
      this._groupService
        .getNameOfGroup(this.member.atom_id)
        .then(name => this.member.name = name);
    }

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value === true &&
        this.member.atom_id &&
        this.member.name
      ) {
        this.req = this._groupService.updateNameOfMember(
          this.member.atom_id,
          this.member.name
        );
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) this.req.then(success => {
        this.member.name = "";
        this.req = null;
      });
    });
  }
}
