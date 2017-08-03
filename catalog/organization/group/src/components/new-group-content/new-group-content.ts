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
      if (this.initialMember.atom_id) {
        this._graphQlService
          .post(`
            addExistingMember(
              group_id: "${this.group.atom_id}",
              member_id: "${this.initialMember.atom_id}"
            )
          `)
          .subscribe(_ => undefined);
      }

      if (this.group.name) {
        this._graphQlService
          .post(`
            renameGroup(
              group_id: "${this.group.atom_id}",
              name: "${this.group.name}"
            )
          `)
          .map(data => data.renameGroup)
          .subscribe(success => {
            if (success) {
              this.group.name = "";
            }
          });
      }

    });
  }
}
