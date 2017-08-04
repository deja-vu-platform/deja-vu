import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {NamedAtom} from "../../shared/data";
import {getName} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowNameComponent {
  @Field("Group | Subgroup | Member") named: NamedAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.named.atom_id && !this.named.name) {
      getName(this._graphQlService, this.named.atom_id)
        .then(name => this.named.name = name);
    }
  }
}
