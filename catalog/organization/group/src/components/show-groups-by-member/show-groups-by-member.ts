import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {MemberAtom, Group, GroupAtom} from "../../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupsByMemberComponent implements AfterInit {
  @Field("Member") member: MemberAtom;
  groups = [];
  private _fetched = undefined;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const retrieveGroups = () => {
      if (!this.member.atom_id || this.member.atom_id === this._fetched) return;
      this._fetched = this.member.atom_id;

      this.groups = [];
      this._graphQlService
        .get(`
          groupsByMember(atom_id: "${this.member.atom_id}") {
            atom_id,
            name
          }
        `)
        .map(data => data.groupsByMember)
        .flatMap((groups, unused_ix) => Observable.from(groups))
        .map((group: Group) => {
          const group_atom = this._clientBus.new_atom<GroupAtom>("Group");
          group_atom.atom_id = group.atom_id;
          group_atom.name = group.name;
          return group_atom;
        })
        .subscribe(group => {
          this.groups.push(group);
        });
    };
    this.member.on_change(retrieveGroups);
    retrieveGroups();
  }
}
