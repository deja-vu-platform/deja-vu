import {Widget, AfterInit, Field} from "client-bus";

import {GraphQlService} from "gql";
import "rxjs/add/operator/toPromise";

import {TargetAtom} from "../../shared/data";


@Widget({
  fqelement: "Follow",
  ng2_providers: [GraphQlService],
  template: `{{target.name}}`
})
export class ShowTargetComponent implements AfterInit {
  @Field("Target") target: TargetAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.target.atom_id && !this.target.name) {
      this._graphQlService
        .get(`
          target_by_id(atom_id: "${this.target.atom_id}") {
            name
          }
        `)
        .toPromise()
        .then(data => this.target.name = data.target_by_id.name);
    }
  }
}
