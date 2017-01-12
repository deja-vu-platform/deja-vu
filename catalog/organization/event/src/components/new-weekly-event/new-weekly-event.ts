import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewWeeklyEventComponent {
  starts_on: string = "";
  ends_on: string = "";
  start_time: string = "";
  end_time: string = "";
  weeklyEvent = {atom_id: undefined};

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  onSubmit() {
    this.starts_on = document.getElementById("starts-on-text")["value"];
    this.ends_on = document.getElementById("ends-on-text")["value"];
    this.start_time = document.getElementById("start-time-text")["value"];
    this.end_time = document.getElementById("end-time-text")["value"];

    this._graphQlService
      .post(`
        newWeeklyPublicEvent(
          starts_on: "${this.starts_on}", ends_on: "${this.ends_on}",
          start_time: "${this.start_time}", end_time: "${this.end_time}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.weeklyEvent.atom_id = atom_id;
      });
  }

  update(e) {
    console.log(e);
  }

  ngAfterViewInit() {
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
    this._loadScript("bootstrap-timepicker/bootstrap-timepicker.min.js");
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "components/new-weekly-event/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }
}
