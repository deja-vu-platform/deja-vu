import {NgZone} from "@angular/core";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
import {waitFor} from "../_shared/utils";


@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService]
})
export class CreateMarkerPositionComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  @Field("Map") map: MapAtom;

  gmapsAPI: any;
  lastLat = null;
  lastLng = null;

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
    waitFor(this.map, "gmap")
      .then(_ => this.addListeners());
  }

  // watch for map clicks and changes in position form
  addListeners() {
    this.map.gmap.addClickMarker();

    // on map click: update marker field
    this.map.gmap.map.addListener("click", (e) => {
      // update must be done this way to get to form
      this.zone.run(() => {
        this.marker.lat = e.latLng.lat();
        this.marker.lng = e.latLng.lng();
      });
    });

    // on change to marker field: move the marker on the map
    this.marker.on_change(() => {
      if (this.marker.lat !== undefined && this.marker.lng !== undefined) {
        this.map.gmap.moveClickMarker(this.marker);
      }
    });
  }
}
