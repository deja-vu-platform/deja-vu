// import {GraphQlService} from "gql";

import {Widget} from "client-bus";

import {ActivatedRoute} from "@angular/router";

@Widget({fqelement: "Group", template: ""})
export class GroupFromRouteComponent {
  group = {atom_id: "", name: "", members: []};

  constructor(private _route: ActivatedRoute) {}

  dvAfterInit() {
    console.log("Invoke dvAfterInit on group-from-route");
    let updateGroup = (params) => {
      console.log("update group with params", params);
      let atom_id = params["group_id"];
      this.group.atom_id = atom_id;

      // this._graphQlService
      //   .get(`
      //     group_by_id(atom_id: "${atom_id}") {
      //       name
      //     }
      //   `)
      //   .map(data => data.group_by_id.name)
      //   .subscribe(name => this.group.name = name);
    };
    this._route.params.subscribe(params => updateGroup(params));
  }
}
