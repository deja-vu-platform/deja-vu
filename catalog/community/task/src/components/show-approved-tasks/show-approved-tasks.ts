import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowApprovedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  approvedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_tasks = () => {
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
    };

    update_tasks();
    this.assignee.on_change(update_tasks);
  }
}
