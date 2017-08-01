import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";
import {MarkerAtom, MapAtom} from "../../shared/data";
import {
  getGoogleMapsAPI,
  waitFor,
  getMapObject,
  MARKER_ICONS
} from "../../shared/utils";
import {NgZone} from "@angular/core";

import "rxjs/add/operator/map";


@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService]
})
export class CreateMarkerButtonComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  @Field("Map") map: MapAtom;

  gmapsAPI: any;

  constructor(private _graphQlService: GraphQlService, private zone: NgZone) {}

  ngAfterViewInit() {
    getGoogleMapsAPI()
      .then(gmapsAPI => this.gmapsAPI = gmapsAPI)
      .then(_ => waitFor(this.map, "atom_id"))
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.map.obj = mapObj)
      .then(_ => this.initMarker())
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

  // puts marker on the map
  // at first, marker is invisible and map is unchanged
  initMarker() {
    if (!this.marker.obj) {
      const center = this.map.obj.getCenter();
      const position = {lat: center.lat(), lng: center.lng()};
      this.marker.obj = new this.gmapsAPI.Marker({
        position: position,
        map: this.map.obj,
        icon: MARKER_ICONS.BLUE,
        visible: false
      });
    }
  }

  // watch for map clicks and changes in position form
  addListeners() {
    // on map click: update marker position
    this.map.obj.addListener("click", (e) => {
      // update must be done this way to get to form
      this.zone.run(() => {
        this.marker.lat = e.latLng.lat();
        this.marker.lng = e.latLng.lng();
      });
    });

    // on change to marker: move the marker on the map
    this.marker.on_change(() => {
      if (this.marker.lat !== undefined && this.marker.lng !== undefined) {
        this.updatePosition(this.marker);
      }
    });
  }

  // update the marker's position on the map
  updatePosition(position) {
    this.marker.obj.setVisible(true);
    this.marker.obj.setPosition(position);
    this.map.obj.panTo(position);
  }

  valid() {
    return (this.marker.lat !== undefined && this.marker.lng !== undefined);
  }
}
