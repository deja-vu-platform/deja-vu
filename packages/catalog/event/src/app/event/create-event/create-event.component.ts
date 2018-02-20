import {Widget, Field, PrimitiveAtom} from "client-bus";

import {EventAtom} from "../../shared/data";


@Widget({
  fqelement: "Event"
})
export class NewEventComponent {
  @Field("Event") event: EventAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
}
