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
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class WithInitialMembersComponent {
  @Field("Group | Subgroup") parent: ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  options: Named[] = []; // all non-members not in the group
  membersToAdd: Named[] = []; // members we want to add to the group

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

    this.submit_ok.on_change(() => this.addMembers());
  }

  // queues a member for adding once submit_ok is true
  queueMemberAdd(): void {
    const name = getTypeaheadVal(this.wrapId);
    const memberIdx = this.options.findIndex((m => m.name === name));
    const member = this.options[memberIdx];
    if (memberIdx >= 0) {
      this.options.splice(memberIdx, 1); // remove
      this.membersToAdd.push(member);
      setTypeaheadVal(this.wrapId, "");
      this.failed = false;
    } else {
      this.failed = true;
    }
  }

  // adds all members in membersToAdd (pushes to backend)
  addMembers() {
    Promise
      .all(this.membersToAdd.map(m => {
        return this._groupService.addMemberToParent(
          this.parent.atom_id,
          m.atom_id
        );
      }))
      .then(_ => this.membersToAdd = []);
  }
}
