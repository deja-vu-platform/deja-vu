import {GraphQlService} from "gql";
import {Widget, Field, ClientBus} from "client-bus";

import {ItemAtom, ItemArrAtom} from "../../shared/data";

import "rxjs/add/operator/map";

@Widget({fqelement: "Label", ng2_providers: [GraphQlService]})
export class SearchComponent {
  @Field("[Item]") items : ItemArrAtom; // TODO: Change once arrays work

  label: string;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus,
  ) {}

  onSubmit() {
    this.items.arr = [];
    this._graphQlService
      .get(`
        itemsByLabel(label_name: "${this.label}") {
          atom_id,
          name
        }
      `)
      .map(data => data.itemsByLabel)
      .subscribe(items => items.forEach(item => {
        const item_atom = this._clientBus.new_atom<ItemAtom>("Item");
        item_atom.atom_id = item.atom_id;
        item_atom.name = item.name;
        this.items.arr.push(item_atom);
      }));
  }
}
