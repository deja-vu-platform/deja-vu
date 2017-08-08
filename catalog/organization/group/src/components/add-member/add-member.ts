import {ElementRef} from "@angular/core";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {Named, ParentAtom} from "../../shared/data";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal
} from "../../shared/utils";
import {getNonMembersByParent, addMemberToParent} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class AddMemberComponent {
  @Field("Group | Subgroup") parent: ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();
  options: Named[] = []; // all non-members

  constructor(
    private _graphQlService: GraphQlService,
    private _elementRef: ElementRef
  ) {}

  dvAfterInit() {
    if (this.parent.atom_id) {
      getNonMembersByParent(this._graphQlService, this.parent.atom_id)
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
        addMemberToParent(
          this._graphQlService,
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
