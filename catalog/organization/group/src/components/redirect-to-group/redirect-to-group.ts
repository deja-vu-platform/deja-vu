import {GraphQlService} from "gql";

import {Widget} from "client-bus";

import {Router} from "@angular/router";

@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class RedirectToGroupComponent {
  group = {atom_id: "", name: ""};
  prefix = {value: ""};

  constructor(private _graphQlService: GraphQlService,
    private _router: Router) {}

  navigate() {
    console.log("navigate to", this.prefix.value + "/" + this.group.atom_id);
    this._router.navigate([this.prefix.value + "/" + this.group.atom_id]);
  }
}
