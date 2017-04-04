import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "List", ng2_providers: [GraphQlService]})
export class AddItemComponent {
  item = {atom_id: "", name: ""};
  list = {atom_id: ""};
  submit_ok = {value: false};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.list.atom_id) return;

    this._graphQlService
      .get(`
        list_by_id(atom_id: "${this.list.atom_id}") {
          addItem(name: "${this.item.name}") {
            atom_id
          }
        }
      `)
      .subscribe(atom_id => {
        this.item.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }
}
