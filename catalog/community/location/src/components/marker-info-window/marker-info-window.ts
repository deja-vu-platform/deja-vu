import {Widget, Field} from "client-bus";

import {MarkerAtom} from "../_shared/data";

@Widget({
  fqelement: "Location"
})
export class MarkerInfoWindowComponent {
  @Field("Marker") marker: MarkerAtom;
}
