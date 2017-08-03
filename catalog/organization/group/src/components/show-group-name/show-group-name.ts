import "rxjs/add/operator/map";

import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {GroupAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowGroupNameComponent {
  @Field("Group") group: GroupAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.group.atom_id && !this.group.name) {
      this._graphQlService
        .get(`
          group_by_id(
            atom_id: "${this.group.atom_id}"
          ) {
            name
          }
        `)
        .map(data => data.group_by_id.name)
        .subscribe(name => this.group.name = name);
    }
  }
}
