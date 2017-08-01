import {Widget, Field} from "client-bus";

import {MarkerAtom} from "../../shared/data";

@Widget({
  fqelement: "Map"
})
export class MarkerInfoWindowComponent {
  @Field("Marker") marker: MarkerAtom;

  dvAfterInit() {
    console.log("marker", this.marker);
  }
}
