import {NgZone} from "@angular/core";
import "rxjs/add/operator/map";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";


@Widget({
  fqelement: "Map",
  ng2_providers: [
    GraphQlService
  ]
})
export class CreateMarkerButtonComponent {
  @Field("Map") map: MapAtom;
  @Field("Marker") marker: MarkerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService, private zone: NgZone) {}

  ngAfterViewInit() {
    waitFor(this.map, "atom_id")
      .then((map_id: string): Promise<GoogleMap> => waitFor(window, map_id))
      .then((gmap: GoogleMap) => this.addListeners(gmap));
  }

  // adds a marker to the db
  createMarker() {
    this._graphQlService
      .post(`
        createMarker(
          lat: ${this.marker.lat},
          lng: ${this.marker.lng},
          title: "${this.marker.title}"
          map_id: "${this.map.atom_id}"
        ) {
          atom_id
        }
      `)
      .map(data => data.createMarker.atom_id)
      .subscribe(atom_id => {
        this.marker.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }

  // watch for map clicks and changes in position form
  addListeners(gmap: GoogleMap) {
    gmap.addClickMarker((latLng: google.maps.LatLngLiteral) => {
      this.zone.run(() => {
        this.marker.lat = latLng.lat;
        this.marker.lng = latLng.lng;
      });
    });

    // on change to marker field: move the marker on the map
    this.marker.on_change(() => {
      if (this.marker.lat !== undefined && this.marker.lng !== undefined) {
        gmap.moveClickMarker(this.marker, true);
      }
    });
  }

  valid() {
    return (this.marker.lat !== undefined && this.marker.lng !== undefined);
  }
}
