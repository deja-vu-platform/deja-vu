import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

import {MemberAtom, GroupAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupContentComponent {
  @Field("Group") group : GroupAtom;
  @Field("Member") initialMember: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            addExistingMember(atom_id: "${this.initialMember.atom_id}") {
              atom_id
            },
            renameGroup(name: "${this.group.name}") {
              atom_id
            }
          }
        `)
        .subscribe(_ => undefined);
      this.group.name = "";
    });
  }
}
