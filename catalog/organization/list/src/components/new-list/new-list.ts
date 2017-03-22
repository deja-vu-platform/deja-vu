import {GraphQlService} from "gql";

import {Widget} from "client-bus";



@Widget({
  fqelement: "dv-organization-list",
  ng2_providers: [GraphQlService]
})
export class NewListComponent {
  list = {atom_id: "", name: ""};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
         newList(name: "${this.list.name}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.list.atom_id = atom_id;
      });
  }
}
