import {ElementRef} from "@angular/core";
import "rxjs/add/operator/toPromise";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom, GroupAtom} from "../../shared/data";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal
} from "../../shared/utils";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class AddExistingMembersComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  options: MemberAtom[] = []; // all non-members not in the group
  membersToAdd: MemberAtom[] = []; // members we want to add to the group

  constructor(
    private _graphQlService: GraphQlService,
    private _elementRef: ElementRef
  ) {}

  dvAfterInit() {
    this.getNonMembers()
      .then(nonMembers => this.options = nonMembers)
      .then(_ => addTypeahead(this.wrapId, this.options.map(m => {
        return m.name;
      })));

    this.submit_ok.on_change(() => this.addMembers());
  }

  ngAfterViewInit() {
    this._loadStyle();
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

  // gets all members and groups not in this group
  getNonMembers(): Promise<MemberAtom[]> {
    if (this.group.atom_id) {
      return this._graphQlService
        .get(`
          nonMembers(group_id: "${this.group.atom_id}") {
            atom_id,
            name
          }
        `)
        .toPromise()
        .then(data => data.nonMembers)
        .then(nonMembers => this.options = nonMembers);
    } else {
      const members = this._graphQlService
        .get(`
          member_all {
            atom_id,
            name
          }
        `)
        .toPromise()
        .then(data => data.member_all);
      const groups = this._graphQlService
        .get(`
          group_all {
            atom_id,
            name
          }
        `)
        .toPromise()
        .then(data => data.group_all);
      return Promise.all([members, groups])
        .then(arr => arr[0].concat(arr[1]));
    }
  }

  // adds all members in membersToAdd (pushes to backend)
  addMembers() {
    Promise.all(this.membersToAdd.map(m => this.addMember(m)))
      .then(_ => this.membersToAdd = []);
  }

  // adds a member to the group in the group field
  addMember(member: MemberAtom): Promise<boolean> {
    return this._graphQlService
      .post(`
        addExistingMember(
          group_id: "${this.group.atom_id}",
          member_id: "${member.atom_id}"
        )
      `)
      .toPromise()
      .then(data => data.addExistingMember); // success or failure
  }

  // inserts add-existing-members.css onto page
  _loadStyle(): void {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-group/lib/components/" +
      "add-existing-member/add-existing-member.css";
    this._elementRef.nativeElement.appendChild(s);
  }
}
