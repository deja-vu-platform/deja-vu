import {ElementRef} from "@angular/core";
import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

import {Named, ParentAtom} from "../../shared/data";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal
} from "../../shared/utils";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class AddMemberComponent {
  @Field("Group | Subgroup") parent: ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();
  options: Named[] = []; // all non-members

  constructor(
    private _groupService: GroupService,
    private _elementRef: ElementRef
  ) {}

  dvAfterInit() {
    if (this.parent.atom_id) {
      this._groupService.getNonMembersByParent(this.parent.atom_id)
        .then(nonMembers => {
          this.options = nonMembers;
          addTypeahead(this.wrapId, this.options.map(m => {
            return m.name;
          }));
        });
    }
  }

  onSubmit() {
    if (this.parent.atom_id) {
      const name = getTypeaheadVal(this.wrapId);
      const member = this.options.find((m => m.name === name));
      if (member === undefined) {
        this.failed = true;
      } else {
        this._groupService.addMemberToParent(
          this.parent.atom_id,
          member.atom_id
        )
          .then(success => {
            if (success) setTypeaheadVal(this.wrapId, "");
          });
      }
    } else {
      this.failed = true;
    }
  }
}
