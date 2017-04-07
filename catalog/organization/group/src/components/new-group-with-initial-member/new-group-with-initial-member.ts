import {GraphQlService} from "gql";

import {Widget} from "client-bus";

import {Router} from "@angular/router";

@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class NewGroupWithInitialMemberComponent {
  group = {atom_id: "", name: ""};
  initialMember = {atom_id: "", name: ""};
  groupCreatedRedirectRoute = {value: ""};

  constructor(private _graphQlService: GraphQlService,
    private _router: Router) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newGroupWithInitialMember(name: "${this.group.name}",
          initialMember: "${this.initialMember.atom_id}") {
            atom_id
        }
      `)
      .map(data => data.newGroupWithInitialMember.atom_id)
      .subscribe(atom_id => {
        this.group.atom_id = atom_id;
        if (this.groupCreatedRedirectRoute
          && this.groupCreatedRedirectRoute.value.length > 0) {
            this._router.navigate([this.groupCreatedRedirectRoute.value]);
        }
      });
  }
}
