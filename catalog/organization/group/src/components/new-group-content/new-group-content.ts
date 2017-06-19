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
      if (this.submit_ok.value === true) {
        let addMember = () => {
          this._graphQlService
            .get(`
              group_by_id(atom_id: "${this.group.atom_id}") {
                addExistingMember(atom_id: "${this.initialMember.atom_id}") {
                  atom_id
                }
              }
            `)
            .map(data => data.group_by_id.addExistingMember.atom_id);
        };
        let createGroup = () => {
          this._graphQlService
            .post(`
              newGroup(name: "${this.group.name}") {
                atom_id
              }
            `)
            .map(data => data.newGroup.atom_id)
            .subscribe(atom_id => {
              this.group.atom_id = atom_id;
              if (this.initialMember.name) {
                addMember();
              }
            });
        };
        createGroup();
      }
    });
  }
}
