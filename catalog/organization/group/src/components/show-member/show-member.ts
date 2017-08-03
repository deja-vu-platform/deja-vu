import "rxjs/add/operator/map";

import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowMemberComponent {
  @Field("Member") member: MemberAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.member.atom_id && !this.member.name) {
      this._graphQlService
        .get(`
          member_by_id(
            atom_id: "${this.member.atom_id}"
          ) {
            name
          }
        `)
        .map(data => data.member_by_id.name)
        .subscribe(name => this.member.name = name);
    }
  }
}
