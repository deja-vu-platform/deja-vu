import {ElementRef, ViewChild} from "@angular/core";

import {Widget, Field} from "client-bus";

import {MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/GoogleMap";

@Widget({fqelement: "Map"})
export class DisplayMapComponent {
  @Field("Map") map: MapAtom;

  @ViewChild("mapDiv") mapDiv: ElementRef;

  ngAfterViewInit() {
    if (!this.map.gmap) {
      GoogleMap.loadAPI()
        .then(_ => {
          this.map.gmap = new GoogleMap(this.mapDiv);
        });
    }
  }
}
