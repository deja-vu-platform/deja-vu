import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowUncompletedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  uncompletedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {

    console.log ("dv after init");
    console.log(this.assignee);

    const update_tasks = () => {
      console.log("updating");
      console.log(this.assignee);
      if (this.assignee.atom_id === undefined) return;
      console.log("updating");

      return this._graphQlService
      .get(`
        uncompletedTasks(assignee_id: "${this.assignee.atom_id}"){
          name,
          atom_id
        }
      `)
      .subscribe(data => {
        this.uncompletedTasks = data.uncompletedTasks;
      });
    };

    update_tasks();
    this.assignee.on_change(update_tasks);
  }

  markCompleted(task) {
    this._graphQlService
      .post(`
        completeTask(task_id: "${task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
