import {ElementRef} from "@angular/core";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/from";
import "rxjs/add/operator/mergeMap";

import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import * as _u from "underscore";

import {EventAtom} from "../../shared/data";

@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  external_styles: [
    `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.1/css/` +
    `bootstrap-select.min.css`
  ]
})
export class ShowEventsComponent {
  events: EventAtom[] = [];

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef,
      private _clientBus: ClientBus) {
  }

  dvAfterInit() {
    this._graphQlService
      .get(`
        event_all {
          atom_id,
          start_date,
          end_date
        }
      `)
      .map(data => data.event_all)
      .flatMap((events: EventAtom[], unused_ix) => Observable
          .from(events))
      .map(event => _u
          .extendOwn(this._clientBus.new_atom<EventAtom>("Event"), event))
      .subscribe(event => this.events.push(event));
  }

  ngAfterViewInit() {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/` +
      `1.12.1/js/bootstrap-select.min.js`;
    this._elementRef.nativeElement.appendChild(s);
  }
}
