import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";


export interface Member {
  atom_id: string;
  name: string;
}

@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupMembersComponent {
  group = {atom_id: "", members: [], on_change: _ => undefined};
  private _fetched = undefined;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const updateGroup = () => {
      if (!this.group.atom_id || this.group.atom_id === this._fetched) return;

      this._fetched = this.group.atom_id;
      this.group.members = [];

      return this._graphQlService
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
        .map((member: Member) => {
          const memberAtom: Member = this._clientBus.new_atom("Member");
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
