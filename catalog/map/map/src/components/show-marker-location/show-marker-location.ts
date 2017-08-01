import {Widget, Field} from "client-bus";

import {MarkerAtom} from "../../shared/data";

import {
  getGoogleMapsAPI,
  doReverseGeocode,
  waitFor,
  uuidv4
} from "../../shared/utils";

import {GraphQlService} from "gql";

@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService],
  template: `{{location}}`
})
export class ShowMarkerLocationComponent {
  @Field("Marker") marker: MarkerAtom;

  gmapsAPI: any;
  infoWindowId = uuidv4();
  location: string;

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
      .then(_ => waitFor(this.marker, "lat"))
      .then(_ => waitFor(this.marker, "lng"))
      .then(_ => doReverseGeocode(this.gmapsAPI, this.marker))
      .then(location => this.location = location);
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

}
