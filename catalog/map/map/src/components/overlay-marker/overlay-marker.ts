import {Widget, Field, PrimitiveAtom, WidgetValue} from "client-bus";

import {MarkerAtom, MapAtom} from "../../shared/data";

import {
  getMapObject,
  getGoogleMapsAPI,
  waitFor,
  uuidv4,
  overlayMarker,
  removeMarker
} from "../../shared/utils";

import {GraphQlService} from "gql";

@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService]
})
export class OverlayMarkerComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("Map") map: MapAtom;
  @Field("Widget") widget: PrimitiveAtom<WidgetValue>;

  gmapsAPI: any;
  mapObj: any;
  infoWindowId = uuidv4();
  markerObj: any;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    // if we have marker's id but not one of its coordinates
    if (this.marker.atom_id &&
      (
        (!this.marker.lat && this.marker.lat !== 0) ||
        (!this.marker.lng && this.marker.lng !== 0)
      )
    ) {
      this.getMarker();
    }
  }

  ngAfterViewInit() {
    getGoogleMapsAPI()
      .then(gmapsAPI => this.gmapsAPI = gmapsAPI)
      .then(_ => waitFor(this.map, "atom_id"))
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.mapObj = mapObj)
      .then(_ => waitFor(this.marker, "lat"))
      .then(_ => waitFor(this.marker, "lng"))
      .then(_ => this.overlayMarker());
  }

  ngOnDestroy() {
    if (this.gmapsAPI && this.markerObj) {
      removeMarker(this.gmapsAPI, this.markerObj);
    }
  }

  getMarker() {
    this._graphQlService
      .get(`
        marker_by_id(
          atom_id: "${this.marker.atom_id}"
        ) {
          lat,
          lng,
          title
        }
      `)
      .map(data => data.marker_by_id)
      .subscribe(marker => {
        this.marker.lat = marker.lat;
        this.marker.lng = marker.lng;
        this.marker.title = marker.title;
      });
  }

  overlayMarker() {
    this.markerObj = overlayMarker(this.gmapsAPI, this.mapObj, this.marker);

    if (this.marker.title) {
      this.markerObj.setTitle(this.marker.title);
      const infoWindow = new this.gmapsAPI.InfoWindow({
        content: document.getElementById(this.infoWindowId).children[0]
      });
      this.markerObj.addListener("click", () =>
        infoWindow.open(this.mapObj, this.markerObj)
      );
    }
  }
}
