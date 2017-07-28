import {Widget, Field} from "client-bus";
import {MapAtom} from "../../shared/data";
import {getGoogleMapsAPI, newMapObject, uuidv4} from "../../shared/utils";

@Widget({fqelement: "Map"})
export class DisplayMapComponent {
  @Field("Map") map: MapAtom;

  dvAfterInit() {
    if (!this.map.atom_id) this.map.atom_id = uuidv4();
  }

  ngAfterViewInit() {
    getGoogleMapsAPI()
      .then(gmapsAPI => newMapObject(gmapsAPI, this.map.atom_id))
      .then(mapObj => this.map.obj = mapObj);
  }
}
