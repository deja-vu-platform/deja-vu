import {Component, Input, ElementRef} from "@angular/core";
import {GraphQlService} from "gql";

import {Event} from "../../shared/data";


@Component({
  selector: "delete-event",
  templateUrl: "./delete-event.html",
  providers: [GraphQlService]
})
export class DeleteEventComponent {
  @Input() event: Event;

  constructor(private _graphQlService: GraphQlService) {}

  deleteEvent() {
    this._graphQlService
      .post(`
        deleteEvent (
          eid: "${this.event.atom_id}",
          ${this.event.weekly_event_id ?
            `weekly_event_id: "${this.event.weekly_event_id}"`
            : ""}
        ) {
          atom_id
        }
      `)
      .subscribe(atom_id => undefined);
  }
}
