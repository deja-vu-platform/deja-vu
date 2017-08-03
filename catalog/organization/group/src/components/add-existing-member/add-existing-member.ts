import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

import {GroupAtom} from "../../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class AddExistingMemberComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  failed = false; // Shows failure message on not found
  member = {atom_id: ""};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.group.atom_id) {
      return;
    }

    this.failed = false;

    this._graphQlService
      .get(`
        group_by_id(atom_id: "${this.group.atom_id}") {
          addExistingMember(atom_id: "${this.member.atom_id}") {
            atom_id
          }
        }
      `)
      .subscribe(data => {
        if (data.group_by_id && data.group_by_id.addExistingMember
          && data.group_by_id.addExistingMember.atom_id) {
            this.submit_ok.value = true;
            this.member.atom_id = "";
          } else {
            this.failed = true;
          }
      });
  }
}
