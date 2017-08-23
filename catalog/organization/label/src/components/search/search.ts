import {ElementRef, ViewChild} from "@angular/core";
import "rxjs/add/operator/map";

import {Widget, Field, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {ItemAtom, ItemArrAtom} from "../_shared/data";
import Select2 from "../_shared/select2";


@Widget({fqelement: "Label", ng2_providers: [GraphQlService]})
export class SearchComponent {
  @Field("[Item]") items : ItemArrAtom; // TODO: Change once arrays work

  @ViewChild("select") select: ElementRef;

  select2: Select2;

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
          tokenSeparators: [","]
        };
        Select2.loadAPI().then(() => {
          this.select2 = new Select2(this.select, options);
        });
      });
  }

  onSubmit() {
    this.items.arr = [];
    const labels = this.select2.getValues();
    const label_names_string = this._graphQlService.list(labels);
    this._graphQlService
      .get(`
        itemsByLabels(label_names: ${label_names_string}) {
          atom_id,
          name
        }
      `)
      .map(data => data.itemsByLabels)
      .subscribe(items => items.forEach(item => {
        const item_atom = this._clientBus.new_atom<ItemAtom>("Item");
        item_atom.atom_id = item.atom_id;
        item_atom.name = item.name;
        this.items.arr.push(item_atom);
      }));
  }
}
