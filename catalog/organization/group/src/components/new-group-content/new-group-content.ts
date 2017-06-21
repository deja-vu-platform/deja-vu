import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupContentComponent {
  group = {atom_id: "", name: ""};
  initialMember = {atom_id: "", name: ""};
  submit_ok = {value: false, on_after_change: _ => undefined};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            addExistingMember(atom_id: "${this.initialMember.atom_id}") {
              atom_id
            },
            renameGroup(name: "${this.group.name}") {
              atom_id
            }
          }
        `)
        .subscribe(_ => undefined)
      ;
      this.group.name = "";
    });
  }
}
