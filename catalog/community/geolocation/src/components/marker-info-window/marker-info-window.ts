import {Widget, Field} from "client-bus";

import {MarkerAtom} from "../_shared/data";

@Widget({
  fqelement: "Geolocation"
})
export class MarkerInfoWindowComponent {
  @Field("Marker") marker: MarkerAtom;
}
