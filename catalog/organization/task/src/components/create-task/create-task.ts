import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class CreateTaskComponent {
  task = {atom_id: undefined, name: ""};
  assigner = {atom_id: undefined, name: ""};
  assignee = {atom_id: undefined};
  expiration_date: string = "";
  assignee_options = [];

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  dvAfterInit() {
    this._graphQlService
      .get(`
        assignee_all {
          atom_id,
          name
        }
      `)
      .subscribe(data => {
        this.assignee_options = data.assignee_all;
      });
  }

  onSubmit() {
    let expirationDateText: Element =
      document.getElementById("expiration-date-text");
    this.expiration_date = expirationDateText["value"];

    this._graphQlService
      .post(`
        createTask(
          name: "${this.task.name}",
          assigner: "${this.assigner.atom_id}"
          assignee: "${this.assignee.atom_id}",
          expires_on: "${this.expiration_date}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.task.atom_id = atom_id;
        expirationDateText["value"] = "";
        this.expiration_date = "";
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
      "create-task/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }

  _loadStyle(href: string) {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-task/lib/components/" +
      "create-task/vendor/" + href;
    this._elementRef.nativeElement.appendChild(s);
  }


}
