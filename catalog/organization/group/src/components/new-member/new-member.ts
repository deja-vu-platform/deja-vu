import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {NamedAtom} from "../../shared/data";
import {createMember} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewMemberComponent {
  @Field("Member") member: NamedAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.member.atom_id = "";
      }
    });
  }

  submit() {
    createMember(this._graphQlService)
      .then(atom_id => {
        if (atom_id) {
          this.member.atom_id = atom_id;
          this.submit_ok.value = true;
        }
      });
  }
}
