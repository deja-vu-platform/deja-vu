import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "List",
  ng2_providers: [GraphQlService]
})
export class EditItemCheckedComponent {
  item = {atom_id: "", name: "", checked: false};

  constructor(
      private _graphQlService: GraphQlService) {}

  toggleChecked() {
    console.log("editItemChecked", this.item.atom_id);

    let checkState = !this.item.checked;
    this.item.checked = checkState;

    this._graphQlService
      .post(`
        setItemChecked(atom_id: "${this.item.atom_id}",
          checked: ${checkState})
      `)
      .map(val => val.setItemChecked)
      .subscribe(data => true);
  }
}
