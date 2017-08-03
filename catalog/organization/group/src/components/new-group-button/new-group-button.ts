import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

import {MemberAtom, GroupAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupButtonComponent {
  @Field("Group") group: GroupAtom;
  @Field("Member") initialMember: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  submit() {
    let addMember = () => {
      this._graphQlService
        .post(`
          addExistingMember(
            group_id: "${this.group.atom_id}",
            member_id: "${this.initialMember.atom_id}"
          )
        `)
        .subscribe(_ => undefined);
    };

    let createGroup = () => {
      this._graphQlService
        .post(`
          newGroup(name: "${this.group.name}") {
            atom_id
          }
        `)
        .map(data => data.newGroup.atom_id)
        .subscribe(atom_id => {
          this.group.atom_id = atom_id;
          if (this.initialMember.atom_id) {
            addMember();
          }
          this.submit_ok.value = !this.submit_ok.value;
        });
    };

    createGroup();
  }

  valid() {
    return (this.group.name ? true : false);
  }
}
