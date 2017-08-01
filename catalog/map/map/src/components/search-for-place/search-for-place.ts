import {Widget, Field, ClientBus} from "client-bus";
import {NgZone} from "@angular/core";

import {MapAtom, MarkerAtom} from "../../shared/data";

import {
  getGoogleMapsAPI,
  waitFor,
  uuidv4,
  getMapObject,
  MARKER_ICONS
} from "../../shared/utils";


@Widget({
  fqelement: "Map"
})
export class SearchForPlaceComponent {
  @Field("Map") map: MapAtom;
  @Field("Marker") marker: MarkerAtom; // used when creating new markers in db

  searchBoxId = uuidv4();
  gmapsAPI: any;
  placeMarkers = [];
  selectedMarker = null;

  constructor(private _clientBus: ClientBus, private zone: NgZone) {}


  ngAfterViewInit() {
    getGoogleMapsAPI()
      .then(gmapsAPI => this.gmapsAPI = gmapsAPI)
      .then(_ => waitFor(this.map, "atom_id"))
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.map.obj = mapObj)
      .then(_ => this.initMarker())
      .then(_ => this.createSearchBox());
  }

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

  createSearchBox() {
    // Create the search box.
    let input = document.getElementById(this.searchBoxId);
    var searchBox = new this.gmapsAPI.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    this.map.obj.addListener("bounds_changed", () => {
      searchBox.setBounds(this.map.obj.getBounds());
    });

    // Listen for the event fired when the user selects a prediction
    // and update place markers
    searchBox.addListener("places_changed", () => {
      var places = searchBox.getPlaces();
      this.placeMarkers = [];

      // add a marker for each place
      places.forEach((place) => {
        if (place.geometry) {
          // Create a marker for each place.
          const markerAtom = this._clientBus.new_atom<MarkerAtom>("Marker");
          markerAtom.lat = place.geometry.location.lat();
          markerAtom.lng = place.geometry.location.lng();
          markerAtom.title = place.name;
          this.zone.run(() => {
            this.placeMarkers.push(markerAtom);
          });

          // set position of top level marker when place marker is clicked
          // hide top level marker to avoid ugly overlap
          waitFor(markerAtom, "obj")
            .then(_ => markerAtom.obj.addListener("click", (e) => {
              this.zone.run(() => {
                // set selected position to position of clicked marker
                this.marker.lat = e.latLng.lat();
                this.marker.lng = e.latLng.lng();
                // hide marker that gets dropped on click
                this.marker.obj.setVisible(false);
                // make the clicked marker the blue marker
                if (this.selectedMarker) {
                  this.selectedMarker.setIcon(MARKER_ICONS.RED);
                }
                this.selectedMarker = markerAtom.obj;
                this.selectedMarker.setIcon(MARKER_ICONS.BLUE);
              });
            }));
        }
      });
    });
    // when dropped blue marker comes back, make selected marker red
    this.map.obj.addListener("click", _ => {
      if (this.selectedMarker) {
        this.selectedMarker.setIcon(MARKER_ICONS.RED);
        this.selectedMarker = null;
      }
    });
  }
}
