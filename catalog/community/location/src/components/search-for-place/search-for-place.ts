import {ElementRef, ViewChild, NgZone} from "@angular/core";

import {Widget, Field, ClientBus} from "client-bus";

import {MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";


@Widget({
  fqelement: "Location"
})
export class SearchForPlaceComponent {
  @Field("Map") map: MapAtom;

  @ViewChild("input") input: ElementRef;

  constructor(private _clientBus: ClientBus, private zone: NgZone) {}

  ngAfterViewInit() {
    waitFor(this.map, "atom_id")
      .then((map_id: string): Promise<GoogleMap> => waitFor(window, map_id))
      .then((gmap: GoogleMap) => this.installSearch(gmap));
  }

  installSearch(gmap: GoogleMap) {
    gmap.addClickMarker();
    gmap.addSearchBox(this.input);
  }
}
