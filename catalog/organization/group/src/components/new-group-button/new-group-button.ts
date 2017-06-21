import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupButtonComponent {
  group = {atom_id: "", name: ""};
  initialMember = {atom_id: "", name: ""};
  submit_ok = {value: false};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  submit() {
    let addMember = () => {
      this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            addExistingMember(atom_id: "${this.initialMember.atom_id}") {
              atom_id
            }
          }
        `)
        .map(data => data.group_by_id.addExistingMember.atom_id)
        .subscribe(_ => undefined)
      ;
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
          this.submit_ok.value = !this.submit_ok.value;
        })
      ;
    };
    createGroup();
  }

  valid() {
    return (this.group.name ? true : false);
  }
}
