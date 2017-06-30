import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {GroupAtom, Member, MemberAtom} from "../../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupComponent implements AfterInit {
  @Field("Group") group: GroupAtom;
  private _fetched = undefined;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const updateGroup = () => {
      if (!this.group.atom_id || this.group.atom_id === this._fetched) return;
      this._fetched = this.group.atom_id;

      const query = this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            name,
            members {
              atom_id,
              name
            }
          }
        `);

      query
        .map(data => data.group_by_id.name)
        .subscribe(name => this.group.name = name);

      this.group.members = [];
      query
        .map(data => data.group_by_id.members)
        .flatMap((members, unused_ix) => Observable.from(members))
        .map((member: Member) => {
          const memberAtom = this._clientBus.new_atom<MemberAtom>("Member");
          memberAtom.atom_id = member.atom_id;
          memberAtom.name = member.name;
          return memberAtom;
        })
        .subscribe(member => {
          this.group.members.push(member);
        });
    };

    updateGroup();
    this.group.on_change(updateGroup);
  }
}
