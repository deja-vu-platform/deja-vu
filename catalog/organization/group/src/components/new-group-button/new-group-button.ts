import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, PrimitiveAtom} from "client-bus";

import {MemberAtom, GroupAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupButtonComponent {
  @Field("Group") group: GroupAtom;
  @Field("Member") initialMember: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  submit() {
    let addMember = () => {
      this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            addExistingMember(atom_id: "${this.initialMember.atom_id}") {
              atom_id
            }
          }
        `)
        .map(data => data.group_by_id.addExistingMember.atom_id)
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
          if (this.initialMember.name) {
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
