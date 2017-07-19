import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";
import {MarkerAtom, MapAtom} from "../../shared/data";
import {getGoogleMapsAPI, getMapObject} from "../../shared/map_utils";
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
  mapObj: any;
  tempMarkerObj: any;

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
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.mapObj = mapObj)
      .then(_ => this.addListeners());
  }

  // make map update position on click
  addListeners() {
    // function to update the position marker on the map
    let updatePosition = (position) => {
      if (!this.tempMarkerObj) {
        const blue = "http://maps.google.com/mapfiles/ms/icons/blue.png";
        this.tempMarkerObj = new this.gmapsAPI.Marker({
          position: position,
          map: this.mapObj,
          icon: blue
        });
      } else {
        this.tempMarkerObj.setPosition(position);
      }
      this.mapObj.panTo(position);
    };
    // call update position when position field changes
    this.marker.on_change(() => {
      if (this.marker.lat !== undefined && this.marker.lng !== undefined) {
        updatePosition(this.marker);
      }
    });
    // modify position field when map is clicked (triggers updatePosition)
    this.mapObj.addListener("click", (e) => {
      // update must be done this way for form to reflect new position on screen
      this.zone.run(() => {
        this.marker.lat = e.latLng.lat();
        this.marker.lng = e.latLng.lng();
      });
    });
  }
}
