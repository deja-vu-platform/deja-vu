import {GraphQlService} from "gql";

import {Widget} from "client-bus";



@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ApproveTaskComponent {
  task = {atom_id: undefined};

  constructor(
    private _graphQlService: GraphQlService) {}

  markApproved() {
    this._graphQlService
      .post(`
        approveTask(task_id: "${this.task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
