import {GraphQlService} from "gql";

import {Widget, ClientBus, AfterInit} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Group, GroupAtom} from "../../shared/data";


@Widget({fqelement: "Group", ng2_providers: [GraphQlService]})
export class ShowGroupsComponent implements AfterInit {
  groups = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const retrieveGroups = () => {
      this.groups = [];
      this._graphQlService
        .get(`
          group_all {
            atom_id,
            name
          }
        `)
        .map(data => data.group_all)
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
    retrieveGroups();
  }
}
