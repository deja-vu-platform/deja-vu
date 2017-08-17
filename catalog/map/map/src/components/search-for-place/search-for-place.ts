import {ElementRef, ViewChild, NgZone} from "@angular/core";

import {Widget, Field, ClientBus} from "client-bus";

import {MapAtom, MarkerAtom} from "../_shared/data";
import {waitFor} from "../_shared/utils";


@Widget({
  fqelement: "Map"
})
export class SearchForPlaceComponent {
  @Field("Map") map: MapAtom;
  @Field("Marker") marker: MarkerAtom; // used when creating new markers in db

  @ViewChild("input") input: ElementRef;

  selectedMarker = null;

  constructor(private _clientBus: ClientBus, private zone: NgZone) {}


  ngAfterViewInit() {
    waitFor(this.map, "gmap")
      .then(_ => {
        this.map.gmap.addClickMarker();
        this.map.gmap.addSearchBox(this.input);
      });
  }
}
