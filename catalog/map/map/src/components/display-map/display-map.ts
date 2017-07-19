import {ElementRef} from "@angular/core";
import {Widget, Field} from "client-bus";
import {MapAtom} from "../../shared/data";
import {initGoogleMapsAPI, newMapObject, uuidv4} from "../../shared/map_utils";

@Widget({fqelement: "Map"})
export class DisplayMapComponent {
  @Field("Map") map: MapAtom;

  constructor(private _elementRef: ElementRef) {}

  dvAfterInit() {
    if (!this.map.atom_id) this.map.atom_id = uuidv4();
  }

  ngAfterViewInit() {
    initGoogleMapsAPI()
      .then(gmapsAPI => newMapObject(gmapsAPI, this.map.atom_id));
  }
}
