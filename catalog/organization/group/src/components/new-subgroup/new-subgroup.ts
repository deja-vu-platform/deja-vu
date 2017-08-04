import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {ParentAtom} from "../../shared/data";
import {createSubgroup} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewSubgroupComponent {
  @Field("Subroup") subgroup: ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.subgroup.atom_id = "";
      }
    });
  }

  submit() {
    createSubgroup(this._graphQlService)
      .then(atom_id => {
        if (atom_id) {
          this.subgroup.atom_id = atom_id;
          this.submit_ok.value = true;
        }
      });
  }
}
