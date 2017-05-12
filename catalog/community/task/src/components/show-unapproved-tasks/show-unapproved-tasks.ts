import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowUnapprovedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  unapprovedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_tasks = () => {
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
    };

    update_tasks();
    this.assignee.on_change(update_tasks);
  }
}
