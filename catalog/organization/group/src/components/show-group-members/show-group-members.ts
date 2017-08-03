import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import {Observable} from "rxjs/Observable";

import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MemberAtom, GroupAtom} from "../../shared/data";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowGroupMembersComponent {
  @Field("Group") group: GroupAtom;
  private _fetched = undefined;

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
}
