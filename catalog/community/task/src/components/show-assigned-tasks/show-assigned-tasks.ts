import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowAssignedTasksComponent {
  assigner = {atom_id: undefined, on_change: _ => undefined};
  assignedTasks = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_tasks = () => {
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
    };

    update_tasks();
    this.assigner.on_change(update_tasks);
  }
}
