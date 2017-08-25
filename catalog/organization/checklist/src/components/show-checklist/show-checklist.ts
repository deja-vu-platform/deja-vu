import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";
import {Item, ItemAtom, ChecklistAtom} from "../shared/data";


@Widget({fqelement: "Checklist", ng2_providers: [GraphQlService]})
export class ShowChecklistComponent implements AfterInit {
  @Field("Checklist") checklist: ChecklistAtom;
  private _fetched = undefined;

  constructor(
      private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_checklist = () => {
      if (!this.checklist.atom_id || this.checklist.atom_id === this._fetched) {
        return;
      }
      this._fetched = this.checklist.atom_id;

      this.checklist.items = [];
      this._graphQlService
        .get(`
          checklist_by_id(atom_id: "${this.checklist.atom_id}") {
            items {
              atom_id,
              name,
              checked
            }
          }
        `)
        .map(data => data.checklist_by_id.items)
        .flatMap((items, unused_ix) => Observable.from(items))
        .map((item: Item) => {
          const item_atom = this._clientBus.new_atom<ItemAtom>("Item");
          item_atom.atom_id = item.atom_id;
          item_atom.name = item.name;
          item_atom.checked = item.checked;
          return item_atom;
        })
        .subscribe(item => {
          this.checklist.items.push(item);
        });
    };

    update_checklist();
    this.checklist.on_change(update_checklist);
  }
}
