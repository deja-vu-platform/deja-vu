import {ElementRef} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS],
  styles: [``]
})
export class NewWeeklyEventComponent {
  starts_on: string;
  ends_on: string;
  start_time; end_time;
  guests;
  weeklyEvent = {atom_id: undefined};

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newWeeklyEvent(
          starts_on: "${this.starts_on}", ends_on: "${this.ends_on},
          start_time: "${this.start_time}", end_time: "${this.end_time}",
          guests: ${this.guests}) {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.weeklyEvent.atom_id = atom_id;
      });
  }

  ngAfterViewInit() {
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "components/new-weekly-event/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }
}
