import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";
import {Item, ItemAtom, ListAtom} from "../shared/data";


@Widget({fqelement: "List", ng2_providers: [GraphQlService]})
export class ShowListComponent implements AfterInit {
  @Field("List") list: ListAtom;
  private _fetched = undefined;

  constructor(
      private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_list = () => {
      if (!this.list.atom_id || this.list.atom_id === this._fetched) return;
      this._fetched = this.list.atom_id;

      this.list.items = [];
      this._graphQlService
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
          const item_atom = this._clientBus.new_atom<ItemAtom>("Item");
          item_atom.atom_id = item.atom_id;
          item_atom.name = item.name;
          item_atom.checked = item.checked;
          return item_atom;
        })
        .subscribe(item => {
          this.list.items.push(item);
        });
    };

    update_list();
    this.list.on_change(update_list);
  }
}
