import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  ng2_providers: [GraphQlService]
})
export class ShowApprovedTasksComponent {
  assignee = {atom_id: undefined};
  approvedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
    .get(`
      approvedTasks(assignee_id: "${this.assignee.atom_id}"){
        name
      }
    `)
    .subscribe(data => {
      this.approvedTasks = data.approvedTasks;
    });
  }
}
