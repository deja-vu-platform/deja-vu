import {Widget, Field, PrimitiveAtom} from "client-bus";
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
export class NewMemberComponent {
  @Field("Member") member: NamedAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.member.atom_id = "";
      }
    });
  }

  submit() {
    this._groupService.createMember()
      .then(atom_id => {
        if (atom_id) {
          this.member.atom_id = atom_id;
          this.submit_ok.value = true;
        }
      });
  }
}
