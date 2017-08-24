import {ElementRef, ViewChild} from "@angular/core";

import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
import GoogleMap from "../_shared/google-map";
import {waitFor} from "../_shared/utils";

@Widget({
  fqelement: "Location",
  ng2_providers: [GraphQlService]
})
export class OverlayMarkerComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("Map") map: MapAtom;

  @ViewChild("infoWindow") infoWindow: ElementRef;

  gmap: GoogleMap;
  markerObj: google.maps.Marker;

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
    waitFor(this.marker, "lat")
      .then(_ => waitFor(this.marker, "lng"))
      .then(_ => waitFor(this.map, "atom_id"))
      .then((map_id: string): Promise<GoogleMap> => waitFor(window, map_id))
      .then((gmap: GoogleMap) => {
        this.gmap = gmap;
        this.overlayMarker();
      });
  }

  ngOnDestroy() {
    if (this.markerObj) {
      this.gmap.removeMarker(this.markerObj);
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
    // invisible wrapper into which infoWindow is loaded
    const invisWrap = this.infoWindow.nativeElement;

    // wait for info window to be loaded
    waitFor(invisWrap.children, "0")
      .then(_ => waitFor(invisWrap.children[0].children, "1"))
      .then(_ => {
        let content: string | Node;
        if (invisWrap.children[0].children[1].children) {
          content = invisWrap.children[0].children[1];
        } else if (this.marker.title) {
          content = this.marker.title;
        }
        this.markerObj = this.gmap.overlayMarker(this.marker, content);
      });
  }
}
