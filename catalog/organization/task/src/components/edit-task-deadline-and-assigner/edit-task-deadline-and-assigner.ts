import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget, Field, Atom, AfterInit, PrimitiveAtom} from "client-bus";

import {NamedAtom} from "../shared/data";

@Widget({
  fqelement: "Task",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class EditTaskDeadlineAndAssignerComponent implements AfterInit {
  @Field("Task") task: NamedAtom;
  @Field("Assigner") assigner: Atom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  expiration_date: Element;

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  dvAfterInit() {
    this.expiration_date = document.getElementById("expiration-date-text");

    this.submit_ok.on_after_change(() => {
      this._graphQlService
        .get(`
          task_by_id(atom_id: "${this.task.atom_id}") {
            updateTask(
              expiration_date: "${this.expiration_date["value"]}",
              assigner_id: "${this.assigner.atom_id}"
            )
          }
        `)
        .subscribe(_ => {
          // Clear out the field on success
          this.expiration_date["value"] = "";
        });
    });
  }

  ngAfterViewInit() {
    // Datepicker scripts need to be loaded this way
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
    this._loadStyle("bootstrap-datepicker/bootstrap-datepicker3.min.css");
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "node_modules/dv-organization-task/lib/components/" +
      "edit-task-deadline-and-assigner/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }

  _loadStyle(href: string) {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-task/lib/components/" +
      "edit-task-deadline-and-assigner/vendor/" + href;
    this._elementRef.nativeElement.appendChild(s);
  }
}
