import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowPendingApprovalTasksComponent {
  assigner = {atom_id: undefined, on_change: _ => undefined};
  pendingApprovalTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_tasks = () => {
      if (this.assigner.atom_id === undefined) return;

      this._graphQlService
      .get(`
        pendingApprovalTasks(assigner_id: "${this.assigner.atom_id}"){
          name,
          atom_id
        }
      `)
      .subscribe(data => {
        this.pendingApprovalTasks = data.pendingApprovalTasks;
      });
    };

    update_tasks();
    this.assigner.on_change(update_tasks);
  }

  markApproved(task) {
    this._graphQlService
      .post(`
        approveTask(task_id: "${task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
