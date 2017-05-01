import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";

import * as _u from "underscore";


export interface Item {
  atom_id: string;
  name: string;
  checked: boolean;
}


@Widget({fqelement: "List", ng2_providers: [GraphQlService]})
export class ShowListComponent {
  list = {atom_id: "", items: [], on_change: _ => undefined};
  fields = {};

  constructor(
      private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_list = () => {
      if (!this.list.atom_id) return;

      this.list.items = [];
      return this._graphQlService
        .get(`
          list_by_id(atom_id: "${this.list.atom_id}") {
            items {
              atom_id,
              name,
              checked
            }
          }
        `)
        .map(data => data.list_by_id.items)
        .flatMap((items, unused_ix) => Observable.from(items))
        .map((item: Item) => {
          const item_atom: Item = this._clientBus.new_atom("Item");
          item_atom.atom_id = item.atom_id;
          item_atom.name = item.name;
          item_atom.checked = item.checked;
          return {item: item_atom};
        })
        .map(item => _u.extend(item, this.fields))
        .subscribe(item => {
          this.list.items.push(item);
        });
    };

    update_list();
    // This seems to cause an infinite loop
    // this.list.on_change(update_list);
  }


}
