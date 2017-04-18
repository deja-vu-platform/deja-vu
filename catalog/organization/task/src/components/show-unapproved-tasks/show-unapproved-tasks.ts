import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  ng2_providers: [GraphQlService]
})
export class ShowUnapprovedTasksComponent {
  assignee = {atom_id: undefined};
  unapprovedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
    .get(`
      unapprovedTasks(assignee_id: "${this.assignee.atom_id}"){
        name
      }
    `)
    .subscribe(data => {
      this.unapprovedTasks = data.unapprovedTasks;
    });
  }
}
