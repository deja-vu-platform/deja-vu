import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {EventAtom} from "../../shared/data";


@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService]
})
export class DeleteEventComponent {
  @Field("Event") event: EventAtom;

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
      .subscribe(atom_id => {
        console.log(atom_id);
      });
  }
}
