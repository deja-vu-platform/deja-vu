import {Widget} from "client-bus";

import {ActivatedRoute} from "@angular/router";

@Widget({fqelement: "List", template: ""})
export class ListFromRouteComponent {
  list = {atom_id: "", name: "", items: []};

  constructor(private _route: ActivatedRoute) {}

  dvAfterInit() {
    let updateList = (params) => {
      let atom_id = params["list_id"];
      this.list.atom_id = atom_id;
    };
    this._route.params.subscribe(params => updateList(params));
  }
}
