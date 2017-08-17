import {ElementRef, ViewChild} from "@angular/core";

import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";
import {waitFor} from "../_shared/utils";

@Widget({
  fqelement: "Map",
  ng2_providers: [GraphQlService]
})
export class OverlayMarkerComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("Map") map: MapAtom;

  @ViewChild("infoWindow") infoWindow: ElementRef;

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
    waitFor(this.map, "gmap")
      .then(_ => waitFor(this.marker, "lat"))
      .then(_ => waitFor(this.marker, "lng"))
      .then(_ => this.overlayMarker());
  }

  ngOnDestroy() {
    if (this.markerObj) {
      this.map.gmap.removeMarker(this.markerObj);
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
    waitFor(invisWrap.children, "1")
      .then(_ => waitFor(invisWrap.children[1].children, "0"))
      .then(_ => {
        let content: string | Node;
        if (invisWrap.children[1].children[0].children) {
          content = invisWrap.children[1].children[0];
        } else if (this.marker.title) {
          content = this.marker.title;
        }
        this.markerObj = this.map.gmap.overlayMarker(this.marker, content);
      });
  }
}
