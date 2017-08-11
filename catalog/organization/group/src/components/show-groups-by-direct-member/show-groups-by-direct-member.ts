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
export class ShowGroupsByDirectMemberComponent {
  @Field("Member") member: MemberAtom;

  groups: GroupAtom[] = [];

  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.fetch();
    this.member.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.member.atom_id) {
      this.fetched = this.member.atom_id;
      if (this.member.atom_id) {
        this.getGroups();
      } else {
        this.groups = [];
      }
    }
  }

  private getGroups() {
    this._groupService.getGroupsByDirectMember(this.member.atom_id)
      .then(groups => {
        this.groups = groups.map((group: GroupAtom) => {
          const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
          group_atom.atom_id = group.atom_id;
          group_atom.name = group.name;
          return group_atom;
        });
      });
  }
}
