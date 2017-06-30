import {GraphQlService} from "gql";

import {Widget} from "client-bus";
import {List} from "../shared/data";


@Widget({fqelement: "List", ng2_providers: [GraphQlService]})
export class NewListComponent {
  list: List;

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
