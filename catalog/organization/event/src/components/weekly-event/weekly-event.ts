import {ElementRef} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


interface WeeklyEvent {
  starts_on: Date;
  ends_on: Date;
}

@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS],
  external_styles: [
    `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.1/css/` +
    `bootstrap-select.min.css`
  ]
})
export class WeeklyEventComponent {
  weekly_events: WeeklyEvent[];

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  ngOnInit() {
    this._graphQlService
      .get(`
        weeklyevent_all {
          starts_on,
          ends_on
        }
      `)
      .map(data => data.weeklyevent_all)
      .subscribe(weeklyevents => {
        console.log(weeklyevents);
        this.weekly_events = weeklyevents;
      });
  }

  onChange(e) {
    console.log(e);
  }

  ngAfterViewInit() {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/` +
      `1.12.1/js/bootstrap-select.min.js`;
    this._elementRef.nativeElement.appendChild(s);
  }
}
