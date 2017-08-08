import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {ParentAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class NewGroupComponent {
  @Field("Group") group : ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.group.atom_id = "";
      }
    });
  }

  submit() {
    this._groupService.createGroup()
      .then(atom_id => {
        if (atom_id) {
          this.group.atom_id = atom_id;
          this.submit_ok.value = true;
        }
      });
  }
}
