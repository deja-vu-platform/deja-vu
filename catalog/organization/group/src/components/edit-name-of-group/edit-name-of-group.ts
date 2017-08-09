import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class EditNameOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  req: Promise<boolean> = null;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.group.atom_id && !this.group.name) {
      this._groupService
        .getNameOfGroup(this.group.atom_id)
        .then(name => this.group.name = name);
    }

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value === true &&
        this.group.atom_id &&
        this.group.name
      ) {
        this.req = this._groupService.updateNameOfGroup(
          this.group.atom_id,
          this.group.name
        );
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) this.req.then(success => {
        this.group.name = "";
        this.req = null;
      });
    });
  }
}
