import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "List",
  template: `{{list.name}}`
})
export class ShowListOverviewComponent {
  list = { name: "", atom_id: "", items: [] };

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const updateListName = () => {
      return this._graphQlService
        .get(`
          list_by_id(atom_id: "${this.list.atom_id}") {
            name
          }
        `)
        .map(data => data.list_by_id.name)
        .subscribe(name => this.list.name = name);
    };
    updateListName();
  }
}
