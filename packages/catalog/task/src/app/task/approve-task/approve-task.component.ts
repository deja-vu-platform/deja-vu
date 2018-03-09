import {GraphQlService} from "gql";

import {Widget, Field, Atom, PrimitiveAtom} from "client-bus";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ApproveTaskComponent {
  @Field("Task") task: Atom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  submitted = false;

  constructor(
    private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.task.atom_id) this.markApproved();
    });
  }

  markApproved() {
    if (this.submitted) return;

    this._graphQlService
      .post(`
        approveTask(task_id: "${this.task.atom_id}")
      `)
      .subscribe(res => {
        this.submitted = true;
        this.submit_ok.value = !this.submit_ok.value;
      });
  }
}
