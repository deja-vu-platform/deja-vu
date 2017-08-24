import {GraphQlService} from "gql";

import {Widget} from "client-bus";
import {Checklist} from "../_shared/data";


@Widget({fqelement: "Checklist", ng2_providers: [GraphQlService]})
export class NewListComponent {
  checklist: Checklist;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
         newChecklist(name: "${this.checklist.name}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.checklist.atom_id = atom_id;
      });
  }
}
