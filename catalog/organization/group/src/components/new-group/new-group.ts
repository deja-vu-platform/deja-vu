import {GraphQlService} from "gql";

import {Widget} from "client-bus";

// import * as _u from "underscore";

@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupComponent {
  group = {atom_id: "", name: ""};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newGroup(name: "${this.group.name}") {
          atom_id
        }
      `)
      .map(data => data.newGroup.atom_id)
      .subscribe(atom_id => this.group.atom_id = atom_id);
  }
}
