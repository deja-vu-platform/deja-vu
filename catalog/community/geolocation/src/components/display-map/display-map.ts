import {ElementRef, ViewChild} from "@angular/core";

import {Widget, Field} from "client-bus";

import {MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";

@Widget({fqelement: "Geolocation"})
export class DisplayMapComponent {
  @Field("Map") map: MapAtom;

  @ViewChild("mapDiv") mapDiv: ElementRef;

  ngAfterViewInit() {
    GoogleMap.loadAPI()
      .then((): Promise<string> => waitFor(this.map, "atom_id"))
      .then((map_id: string) => window[map_id] = new GoogleMap(this.mapDiv));
  }

  ngOnDestroy() {
    window[this.map.atom_id] = undefined; // not automatically cleared
  }
}
