import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ApproveTaskComponent {
  @Field("Task") task: Atom;

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
