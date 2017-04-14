import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  ng2_providers: [GraphQlService]
})
export class ShowTasksComponent {
  assignee = {atom_id: undefined};
  uncompleted_tasks = [];
  completed_tasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
    .get(`
      tasks(assignee_id: "${this.assignee.atom_id}") {
        name
      }
    `)
    .subscribe(tasks => {
      for (let task of tasks) {
        if (task.completed) {
           this.completed_tasks.push(task);
        } else {
           this.uncompleted_tasks.push(task);
        }
      }
    });
  }
}
