import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import "rxjs/add/operator/map";

@Widget({
	fqelement: "Market",
	template: `{{good.name}}`,
	ng2_providers: [GraphQlService]
})
export class ShowGoodComponent {
  good = {
		atom_id: "",
		name: undefined
	};

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.good.atom_id || this.good.name) {
      return;
    }

    this._graphQlService
      .get(`
        good_by_id(atom_id: "${this.good.atom_id}") {
          name,
        }
      `)
      .map(data => data.group_by_id)
      .subscribe(good_by_id => {
        this.good.name = good_by_id.name;
      })
  	;
  }
}
