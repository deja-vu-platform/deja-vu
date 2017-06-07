import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupWithInitialMemberComponent {
  group = {atom_id: "", name: ""};
  initialMember = {atom_id: "", name: ""};
  onGroupCreate = {value: undefined};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  onSubmit() {
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
        .subscribe(atom_id => {
          if (this.onGroupCreate.value) {
            this._clientBus.navigate(this.onGroupCreate.value);
          }
        });
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
          addMember();
        });
    };

    createGroup();
  }
}
