import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowTasksComponent {
  assignee = {atom_id: undefined};
  uncompletedTasks = [];
  completedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
    .get(`
      tasks(assignee_id: "${this.assignee.atom_id}"){
        name,
        completed
      }
    `)
    .subscribe(data => {
      for (let task of data.tasks) {
        if (task.completed) {
           this.completedTasks.push(task);
        } else {
           this.uncompletedTasks.push(task);
        }
      }
    });
  }
}
