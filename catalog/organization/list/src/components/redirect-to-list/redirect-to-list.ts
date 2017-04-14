import {GraphQlService} from "gql";

import {Widget} from "client-bus";

import {Router} from "@angular/router";

@Widget({
  fqelement: "List",
  ng2_providers: [GraphQlService]
})
export class RedirectToListComponent {
  list = {atom_id: "", name: ""};
  prefix = {value: ""};

  constructor(private _graphQlService: GraphQlService,
    private _router: Router) {}

  navigate() {
    this._router.navigate([this.prefix.value + "/" + this.list.atom_id]);
  }
}
