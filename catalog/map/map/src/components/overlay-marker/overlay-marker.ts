import {Widget, Field} from "client-bus";

import {MarkerAtom, MapAtom} from "../../shared/data";

import {
  getGoogleMapsAPI,
  waitFor,
  uuidv4,
  overlayMarker,
  removeMarker,
  getMapObject,
  getInfoWindow
} from "../../shared/utils";

import {GraphQlService} from "gql";

@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService]
})
export class OverlayMarkerComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("Map") map: MapAtom;

  gmapsAPI: any;
  infoWindowId = uuidv4();

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
      .then(mapObj => this.map.obj = mapObj)
      .then(_ => waitFor(this.marker, "lat"))
      .then(_ => waitFor(this.marker, "lng"))
      .then(_ => this.overlayMarker());
  }

  ngOnDestroy() {
    if (this.gmapsAPI && this.marker.obj) {
      removeMarker(this.gmapsAPI, this.marker.obj);
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
    this.marker.obj = overlayMarker(
      this.gmapsAPI, this.map.obj, this.marker, this.marker.title
    );

    const infoWindow = getInfoWindow(this.map.obj);

    // invisible wrapper into which infoWindow is loaded
    const invisWrap = document.getElementById(this.infoWindowId).children[0];

    // wait for info window to be loaded
    waitFor(invisWrap.children, "1")
      .then(_ => waitFor(invisWrap.children[1].children, "0"))
      .then(_ => {
        const content = invisWrap.children[1].children[0];
        // only show infowindow if title is present or widget was replaced
        if (this.marker.title || content.children) {
          this.marker.obj.addListener("click", () => {
            infoWindow.setContent(content);
            infoWindow.open(this.map.obj, this.marker.obj);
          });
        }
      });
  }
}
