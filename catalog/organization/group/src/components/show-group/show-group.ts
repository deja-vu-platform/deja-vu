import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import * as _u from "underscore";

export interface Member {
  atom_id: string;
  name: string;
}

@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class ShowGroupComponent {
  group = {atom_id: "1", members: [], name: "", on_change: _ => undefined};
  fields = {};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const updateGroup = () => {
      let query = this._graphQlService
        .get(`
          group_by_id(atom_id: "${this.group.atom_id}") {
            name,
            members {
              atom_id,
              name
            }
          }
        `);

      // TODO: Can we avoid hitting the server twice here?
      query
        .map(data => data.group_by_id.name)
        .subscribe(name => this.group.name = name);

      return query
        .map(data => data.group_by_id.members)
        .flatMap((members, unused_ix) => Observable.from(members))
        .map((member: Member) => {
          const memberAtom: Member = this._clientBus.new_atom("Member");
          memberAtom.atom_id = member.atom_id;
          memberAtom.name = member.name;
          return {
            member: memberAtom
          };
        })
        .map(member => _u.extend(member, this.fields))
        .subscribe(member => {
          this.group.members.push(member);
        });
    };
    updateGroup();
    this.group.on_change(updateGroup);
  }
}
