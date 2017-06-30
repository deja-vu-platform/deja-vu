import {GraphQlService} from "gql";

import {Widget, Field, AfterInit} from "client-bus";
import {ListAtom} from "../shared/data";


@Widget({fqelement: "List", template: `{{list.name}}`})
export class ShowListOverviewComponent implements AfterInit {
  @Field("List") list: ListAtom;

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
