import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ClaimTaskComponent {
  @Field("Task") task: Atom;
  @Field("Assignee") assignee: Atom;

  constructor(
    private _graphQlService: GraphQlService) {}

  markClaimed() {
    this._graphQlService
      .post(`
        claimTask(
          task_id: "${this.task.atom_id}",
          assignee: "${this.assignee.atom_id}"
        )
      `)
      .subscribe(res => undefined);
  }
}
