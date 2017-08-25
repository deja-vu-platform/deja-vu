import {GraphQlService} from "gql";

import {Widget, Field} from "client-bus";
import {ItemAtom} from "../shared/data";


@Widget({fqelement: "Checklist", ng2_providers: [GraphQlService]})
export class EditItemCheckedComponent {
  @Field("Item") item: ItemAtom;

  constructor(private _graphQlService: GraphQlService) {}

  toggleChecked() {
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
