import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ItemAtom, ListAtom} from "../shared/data";


@Widget({fqelement: "List", ng2_providers: [GraphQlService]})
export class AddItemComponent {
  @Field("Item") item: ItemAtom;
  @Field("List") list: ListAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

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
