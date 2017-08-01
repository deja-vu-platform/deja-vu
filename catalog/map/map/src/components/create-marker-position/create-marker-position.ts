import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";
import {MarkerAtom, MapAtom} from "../../shared/data";
import {
  getGoogleMapsAPI,
  getMapObject,
  waitFor,
  MARKER_ICONS
} from "../../shared/utils";
import {NgZone} from "@angular/core";


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
    getGoogleMapsAPI()
      .then(gmapsAPI => this.gmapsAPI = gmapsAPI)
      .then(_ => waitFor(this.map, "atom_id"))
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.map.obj = mapObj)
      .then(_ => this.initMarker())
      .then(_ => this.addListeners());
  }

  // creates the marker, putting it on the map
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

    // on change to marker lat or lng: move the marker on the map
    this.marker.on_change(() => {
      if (
        definedNonNull(this.marker.lat) &&
        definedNonNull(this.marker.lng) && (
          this.marker.lat !== this.lastLat ||
          this.marker.lng !== this.lastLng
        )
      ) {
        this.lastLat = this.marker.lat;
        this.lastLng = this.marker.lng;
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
}

function definedNonNull(x) {
  return x !== null && x !== undefined;
}
