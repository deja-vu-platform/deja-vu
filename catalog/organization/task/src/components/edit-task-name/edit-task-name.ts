import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget, Field, AfterInit, PrimitiveAtom} from "client-bus";

import {NamedAtom} from "../shared/data";

@Widget({
  fqelement: "Task",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class EditTaskNameComponent implements AfterInit {
  @Field("Task") task: NamedAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  name: Element;

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  dvAfterInit() {
    this.name = document.getElementById("name-text");

    this.submit_ok.on_after_change(() => {
      this._graphQlService
        .get(`
          task_by_id(atom_id: "${this.task.atom_id}") {
            updateTask(
              name: "${this.name["value"]}"
            )
          }
        `)
        .subscribe(_ => {
          // Clear out the field on success
          this.name["value"] = "";
        });
    });
  }
}
