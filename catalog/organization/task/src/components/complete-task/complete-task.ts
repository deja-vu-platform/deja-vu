import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";



@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class CompleteTaskComponent {
  @Field("Task") task: Atom;

  constructor(
    private _graphQlService: GraphQlService) {}

  markCompleted(task) {
    this._graphQlService
      .post(`
        completeTask(task_id: "${this.task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
