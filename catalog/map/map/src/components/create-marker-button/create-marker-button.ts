import {NgZone} from "@angular/core";
import "rxjs/add/operator/map";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
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
    waitFor(this.map, "gmap")
      .then(_ => this.addListeners());
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

  valid() {
    return (this.marker.lat !== undefined && this.marker.lng !== undefined);
  }
}
