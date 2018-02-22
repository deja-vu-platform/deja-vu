import {GraphQlService} from "gql";

import {Widget, Field, Atom, PrimitiveAtom} from "client-bus";
import {TaskAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ClaimTaskComponent {
  @Field("Task") task: TaskAtom;
  @Field("Assignee") assignee: Atom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  claimed = false;

  constructor(
    private _graphQlService: GraphQlService) {}

  markClaimed() {
    if (!this.claimed) {
      this._graphQlService
      .post(`
        claimTask(
          task_id: "${this.task.atom_id}",
          assignee_id: "${this.assignee.atom_id}"
        )
      `)
      .subscribe(res => {
        this.claimed = true;
        this.submit_ok.value = !this.submit_ok.value;
      });
    }
  }
}
