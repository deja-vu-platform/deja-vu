import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  ng2_providers: [GraphQlService]
})
export class ShowUncompletedTasksComponent {
  assignee = {atom_id: undefined};
  uncompletedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
    .get(`
      uncompletedTasks(assignee_id: "${this.assignee.atom_id}"){
        name,
        atom_id
      }
    `)
    .subscribe(data => {
      this.uncompletedTasks = data.uncompletedTasks;
    });
  }

  markCompleted(task) {
    this._graphQlService
      .post(`
        completeTask(task_id: "${task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
