import {NgZone} from "@angular/core";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";


@Widget({
  fqelement: "Geolocation",
  ng2_providers: [GraphQlService]
})
export class CreateMarkerPositionComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  @Field("Map") map: MapAtom;


  constructor(private _graphQlService: GraphQlService, private zone: NgZone) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (
        this.marker.atom_id &&
        this.marker.lat !== undefined &&
        this.marker.lng !== undefined
      ) {
        this._graphQlService
          .get(`
            marker_by_id(
              atom_id: "${this.marker.atom_id}"
            ) {
              update(
                lat: ${this.marker.lat},
                lng: ${this.marker.lng},
                map_id: "${this.map.atom_id}"
              ) {
                atom_id
              }
            }
          `)
          .subscribe(_ => {
            this.marker.lat = undefined;
            this.marker.lng = undefined;
          });
      }
    });
  }

  ngAfterViewInit() {
    waitFor(this.map, "atom_id")
      .then((map_id: string): Promise<GoogleMap> => waitFor(window, map_id))
      .then((gmap: GoogleMap) => this.addListeners(gmap));
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
}
