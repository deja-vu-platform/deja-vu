import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";

@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService],
  template: `{{location}}`
})
export class ShowMarkerLocationComponent {
  @Field("Marker") marker: MarkerAtom;

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
    GoogleMap.loadAPI()
      .then(() => Promise.all([
        waitFor(this.marker, "lat"),
        waitFor(this.marker, "lng")
      ]))
      .then(_ => GoogleMap.doReverseGeocode(this.marker))
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
