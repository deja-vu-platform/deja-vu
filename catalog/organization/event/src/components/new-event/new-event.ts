import {Widget, Field} from "client-bus";

import {EventAtom} from "../../shared/data";


@Widget({
  fqelement: "Event",
  styles: [``]
})
export class NewEventComponent {
  @Field("Event") event: EventAtom;
}
