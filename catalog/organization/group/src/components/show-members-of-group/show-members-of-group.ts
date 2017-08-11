import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class ShowMembersOfGroupComponent {
  @Field("Group") group: GroupAtom;

  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (
      this.group.atom_id &&
      (!this.group.members || this.group.members.length === 0)
    ) {
      this.fetch();
    }

    this.group.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      if (this.group.atom_id) {
        this.getMembers();
      } else {
        this.group.members = [];
      }
    }
  }

  private getMembers() {
    this._groupService.getMembersOfGroup(this.group.atom_id)
      .then(members => {
        this.group.members = members.map((m) => {
          const member_atom = this._clientBus.new_atom<MemberAtom>("Member");
          member_atom.atom_id = m.atom_id;
          member_atom.name = m.name;
          return member_atom;
        });
      });
  }
}
