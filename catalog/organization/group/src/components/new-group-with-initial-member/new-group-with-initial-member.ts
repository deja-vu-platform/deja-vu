import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";
import {MemberAtom, Group} from "../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class NewGroupWithInitialMemberComponent {
  @Field("Member") initialMember: MemberAtom;
  @Field("Widget") onGroupCreate: PrimitiveAtom<WidgetValue>;

  group: Group = {atom_id: "", name: ""};

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
