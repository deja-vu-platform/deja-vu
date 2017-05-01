import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import * as _u from "underscore";

export interface Group {
  atom_id: string;
  name: string;
}

@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowGroupsByMemberComponent {
  member = {atom_id: "", name: "", on_change: _ => undefined};
  groups = [];
  fields = {};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const retrieveGroups = () => {
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
          const group_atom: Group = this._clientBus.new_atom("Group");
          group_atom.atom_id = group.atom_id;
          group_atom.name = group.name;
          return {group:group_atom};
        })
        .map(group => _u.extend(group, this.fields))
        .subscribe(group => this.groups.push(group));
    };
    this.member.on_change(retrieveGroups);
    retrieveGroups();
  }
}
