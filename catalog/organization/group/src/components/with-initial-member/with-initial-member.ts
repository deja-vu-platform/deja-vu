import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ],
  template: ``
})
export class WithInitialMemberComponent {
  @Field("Group") group: GroupAtom;
  @Field("Member") member: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  req: Promise<boolean> = null;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value === true &&
        this.group.atom_id &&
        this.member.atom_id
      ) {
        this.req = this._groupService.addMemberToGroup(
          this.group.atom_id,
          this.member.atom_id
        );
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) this.req.then(success => {
        this.req = null;
      });
    });
  }
}
