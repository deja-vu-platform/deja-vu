import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowAssignedTasksComponent {
  assigner = {atom_id: undefined};
  assignedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assigner.atom_id === undefined) return;

    this._graphQlService
    .get(`
      assignedTasks(assigner_id: "${this.assigner.atom_id}"){
        name
      }
    `)
    .subscribe(data => {
      this.assignedTasks = data.assignedTasks;
    });
  }
}
