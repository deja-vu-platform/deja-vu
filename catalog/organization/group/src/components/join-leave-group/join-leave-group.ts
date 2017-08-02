import {Widget, Field, AfterInit, ClientBus} from "client-bus";

import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/toPromise";

import {MemberAtom, GroupAtom} from "../../shared/data";
import {filterInPlace} from "../../shared/utils";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class JoinLeaveGroupComponent implements AfterInit {
  @Field("Member") member: MemberAtom;
  @Field("Group") group: GroupAtom;

  _fetched: string = "";

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    const updateGroup = () => {
      if (!this.group.atom_id || this.group.atom_id === this._fetched) return;

      this._fetched = this.group.atom_id;
      this.group.members = [];

      this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            members {
              atom_id,
              name
            }
          }
        `)
        .map(data => data.group_by_id.members)
        .flatMap((members, unused_ix) => Observable.from(members))
        .map((member: MemberAtom) => {
          const memberAtom = this._clientBus.new_atom<MemberAtom>("Member");
          memberAtom.atom_id = member.atom_id;
          memberAtom.name = member.name;
          return memberAtom;
        })
        .subscribe(member => {
          if (this.group.members.findIndex(m => {
            return m.atom_id === member.atom_id;
          }) === -1) {
            this.group.members.push(member);
          }
        });
    };

    updateGroup();
    this.group.on_change(updateGroup);
  }

  joinGroup() {
    this._graphQlService
      .post(`
        addExistingMember(
          group_id: "${this.group.atom_id}",
          member_id: "${this.member.atom_id}"
        )
      `)
      .map(data => data.addExistingMember)
      .subscribe(success => {
        if (success) {
          this.group.members.push(this.member);
        }
      });
  }

  leaveGroup() {
    this._graphQlService
      .post(`
        removeMember(
          group_id: "${this.group.atom_id}",
          member_id: "${this.member.atom_id}"
        )
      `)
      .map(data => data.addExistingMember)
      .subscribe(success => {
        if (success) {
          filterInPlace(this.group.members, m => {
            return m.atom_id !== this.member.atom_id;
          });
        }
      });
  }

  inGroup(member: MemberAtom, group: GroupAtom): boolean {
    return group.members.findIndex(m => m.atom_id === member.atom_id) >= 0;
  }
}
