import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

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
export class AddExistingMemberComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();
  options: MemberAtom[] = []; // all non-members
  typeahead: any;

  constructor(
    private _graphQlService: GraphQlService,
    private _elementRef: ElementRef
  ) {}

  dvAfterInit() {
    this._graphQlService
      .get(`
        nonMembers(group_id: "${this.group.atom_id}") {
          atom_id,
          name
        }
      `)
      .map(data => data.nonMembers)
      .subscribe(nonMembers => {
        this.options = nonMembers;
        this.typeahead = addTypeahead(this.wrapId, this.options.map(m => {
          return m.name;
        }));
      });
  }

  ngAfterViewInit() {
    this._loadStyle();
  }

  onSubmit() {
    if (this.group.atom_id) {
      this.failed = false;
      const name = getTypeaheadVal(this.wrapId);
      const member = this.options.find((m => m.name === name));
      if (member === undefined) {
        this.failed = true;
      } else {
        this._graphQlService
          .post(`
            addExistingMember(
              group_id: "${this.group.atom_id}",
              member_id: "${member.atom_id}"
            )
          `)
          .map(data => data.addExistingMember)
          .subscribe(success => {
            if (success) {
              this.submit_ok.value = true;
              setTypeaheadVal(this.wrapId, "");
            }
            this.failed = !success;
          });
      }
    }
  }

  _loadStyle() {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-group/lib/components/" +
      "add-existing-member/add-existing-member.css";
    this._elementRef.nativeElement.appendChild(s);
  }
}
