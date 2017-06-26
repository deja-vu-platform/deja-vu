import {GraphQlService} from "gql";

import {Widget} from "client-bus";
import {Group} from "../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class NewGroupComponent {
  group: Group;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newGroup(name: "${this.group.name}") {
          atom_id
        }
      `)
      .map(data => data.newGroup.atom_id)
      .subscribe(atom_id => this.group.atom_id = atom_id);
  }
}
