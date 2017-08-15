import "rxjs/add/operator/map";

import {Widget, Field, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {ItemAtom, ItemArrAtom} from "../../shared/data";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal
} from "../shared/utils";


@Widget({fqelement: "Label", ng2_providers: [GraphQlService]})
export class SearchComponent {
  @Field("[Item]") items : ItemArrAtom; // TODO: Change once arrays work

  selectID = uuidv4();

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus,
  ) {}

  dvAfterInit() {
    this._graphQlService
      .get(`
        label_all {
          name
        }
      `)
      .subscribe(data => {
        const labels = data.label_all.map((label, idx) => {
          return {id: idx.toString(), text: label.name};
        });
        const options = {
          data: labels,
          tags: true,
          tokenSeparators: [","],
          minimumResultsForSearch: 7
        };
        addTypeahead(this.selectID, options);
      });
  }

  onSubmit() {
    this.items.arr = [];
    const label = getTypeaheadVal(this.selectID)[0];
    this._graphQlService
      .get(`
        itemsByLabel(label_name: "${label}") {
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
