import { ElementRef } from "@angular/core";
import { GraphQlService } from "gql";
import { Widget, Field } from "client-bus";
import { TaskAtom, AssignerAtom } from "../shared/data";

@Widget({
    fqelement: "Task",
    ng2_providers: [GraphQlService],
    styles: [``]
})
export class CreateTaskForAllAssigneesComponent {
    @Field("Task") task: TaskAtom;
    @Field("Assigner") assigner: AssignerAtom;

    expiration_date: string = "";

    constructor(
        private _graphQlService: GraphQlService,
        private _elementRef: ElementRef) { }

    onSubmit() {
        let expirationDateText: Element =
            document.getElementById("expiration-date-text");
        this.expiration_date = expirationDateText["value"];

        this._graphQlService
            .post(`
                createTaskForAllAssignees(
                name: "${this.task.name}",
                assigner_id: "${this.assigner.atom_id}",
                expires_on: "${this.expiration_date}") {
                atom_id
                }
            `)
            .subscribe(res => {
                expirationDateText["value"] = "";
                this.expiration_date = "";
                this.task.name = "";
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
            "create-task-for-all-assignees/vendor/" + src;
        this._elementRef.nativeElement.appendChild(s);
    }

    _loadStyle(href: string) {
        const s = document.createElement("link");
        s.type = "text/css";
        s.rel = "stylesheet";
        s.href = "node_modules/dv-organization-task/lib/components/" +
            "create-task-for-all-assignees/vendor/" + href;
        this._elementRef.nativeElement.appendChild(s);
    }
}
