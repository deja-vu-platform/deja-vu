import {Widget, Field, ClientBus} from "client-bus";
import {NgZone} from "@angular/core";

import {MapAtom, MarkerAtom} from "../../shared/data";

import {
  getGoogleMapsAPI,
  getMapObject,
  overlayMarker,
  removeMarker,
  waitFor,
  uuidv4
} from "../../shared/utils";

@Widget({
  fqelement: "Map"
})
export class SearchForPlaceComponent {
  @Field("Map") map: MapAtom;

  searchBoxId = uuidv4();
  gmapsAPI: any;
  mapObj: any;
  placeMarkers = [];

  constructor(private _clientBus: ClientBus, private zone: NgZone) {}


  ngAfterViewInit() {
    getGoogleMapsAPI()
      .then(gmapsAPI => this.gmapsAPI = gmapsAPI)
      .then(_ => waitFor(this.map, "atom_id"))
      .then(_ => getMapObject(this.map.atom_id))
      .then(mapObj => this.mapObj = mapObj)
      .then(_ => this.createSearchBox());
  }

  ngOnDestroy() {
    this.placeMarkers.forEach((marker) => {
      removeMarker(this.gmapsAPI, marker);
    });
  }

  createSearchBox() {
    // Create the search box.
    let input = document.getElementById(this.searchBoxId);
    var searchBox = new this.gmapsAPI.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    this.mapObj.addListener("bounds_changed", () => {
      searchBox.setBounds(this.mapObj.getBounds());
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
        }
      });
    });
  }

  createSearchBoxOld() {
    // Create the search box.
    let input = document.getElementById(this.searchBoxId);
    var searchBox = new this.gmapsAPI.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    this.mapObj.addListener("bounds_changed", () => {
      searchBox.setBounds(this.mapObj.getBounds());
    });

    // Listen for the event fired when the user selects a prediction
    // and update place markers
    searchBox.addListener("places_changed", () => {
      var places = searchBox.getPlaces();

      // Clear out the old markers.
      this.placeMarkers.forEach((marker) => {
        removeMarker(this.gmapsAPI, marker);
      });
      this.placeMarkers = [];

      // add a marker for each place
      places.forEach((place) => {
        if (place.geometry) {
          // Create a marker for each place.
          this.placeMarkers.push(overlayMarker(
            this.gmapsAPI,
            this.mapObj,
            {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          ));
        }
      });
    });
  }
}
