import {ElementRef} from "@angular/core";
import {} from "@types/googlemaps";

import {insertTag, waitFor, getOrDefault} from "./utils";

const init_script = `
  function afterInitGoogleMapsAPI() {
    console.log("The google maps API is loaded.");
  }
`;

// Build URL for Google Maps API
const key = "AIzaSyBbPL7hviCiMdW7ZkIuq119PuidXV0epwY"; // TODO: pass-in key
const callback = "afterInitGoogleMapsAPI";
const gmaps_script = "https://maps.googleapis.com/maps/api/js?key=" + key +
  "&libraries=places&callback=" + callback;

// Marker image paths
const red = "http://maps.google.com/mapfiles/ms/icons/red.png";
const blue = "http://maps.google.com/mapfiles/ms/icons/blue.png";


export interface GoogleMapOptions extends google.maps.MapOptions {
  autoFitMarkers?: boolean;
  maxZoomAfterFitBounds?: number;
}

// Location of MIT's Lobby 7, used as a default.
const mit: google.maps.LatLngLiteral = {lat: 42.35920, lng: -71.09315};

const defaultOptions: GoogleMapOptions = {
  center: mit,
  zoom: 16,
  maxZoom: 20,
  minZoom: 3,
  streetViewControl: false,
  autoFitMarkers: true,
  maxZoomAfterFitBounds: 18
};


// Instance of a Google Map
// Warning: make sure GoogleMap.loadAPI() has resolved before instantiating
export default class GoogleMap {
  static api; // Google Maps API, TODO: Figure out how to get type
  static geocoder: google.maps.Geocoder;
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds;
  markers: Set<google.maps.Marker>;
  clickMarker: google.maps.Marker;
  clickListner: (pos: google.maps.LatLngLiteral) => void;
  infoWindow: google.maps.InfoWindow;
  searchBox: google.maps.places.SearchBox;
  searchMarkers: google.maps.Marker[];
  autoFitMarkers: boolean;
  maxZoomAfterFitBounds: number;

  // Loads the API, returning a promise which resolves when it is loaded
  // If the API is already loaded, it will just resolve
  static loadAPI(): Promise<void> {
    if (
      !window[gmaps_script] &&
      !getOrDefault(window, ["google", "maps"], undefined)
    ) {
      insertTag("script", {
        src: gmaps_script,
        id: gmaps_script,
        async: true,
        defer: true
      });
      insertTag("script", {
        innerHTML: init_script
      });
    }
    return waitFor(window, "google")
      .then(_ => waitFor(window["google"], "maps"))
      .then(_ => {
        GoogleMap.api = window["google"]["maps"];
        GoogleMap.geocoder = new GoogleMap.api.Geocoder();
      });
  }

  // Returns a string with the closest address to the given point
  // Returns "" if no result can be found
  //   (e.g. if the point is in the middle of the ocean)
  static doReverseGeocode(pos: google.maps.LatLngLiteral): Promise<string> {
    return new Promise((resolve, reject) => {
      if (GoogleMap.geocoder) {
        GoogleMap.geocoder.geocode({"location": pos}, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              resolve(results[0].formatted_address);
            } else {
              resolve("");
            }
          } else {
            reject(`Geocoder failed with status ${status}`);
          }
        });
      } else {
        reject("API has not been loaded.");
      }
    });
  }

  constructor(
    element: ElementRef,
    options: GoogleMapOptions = defaultOptions
  ) {
    this.map = new GoogleMap.api.Map(
      element.nativeElement,
      options
    );
    this.autoFitMarkers = options.autoFitMarkers;
    this.maxZoomAfterFitBounds = options.maxZoomAfterFitBounds;
    this.bounds = new GoogleMap.api.LatLngBounds();
    this.markers = new Set();
    this.infoWindow = new GoogleMap.api.InfoWindow();
    this.map.addListener("click", _ => {
      if (!this.clickMarker) {
        this.infoWindow.close();
      }
    });
  }

  // After calling this method, clicking the map will drop a blue marker
  // Clicking it again will move the marker
  // Listner is called with the position of the marker when it changes
  addClickMarker(
    listner?: (pos: google.maps.LatLngLiteral) => void,
    position: google.maps.LatLng | google.maps.LatLngLiteral = mit
  ) {
    if (!this.clickMarker) {
      this.clickMarker = new GoogleMap.api.Marker({
        position,
        map: this.map,
        visible: false,
        icon: blue
      });
      this.map.addListener("click", (e) => {
        this.clickMarker.setVisible(true);
        this.moveClickMarker(e.latLng);
      });
      this.clickListner = listner;
    }
  }

  // Programatically move the click marker
  // Use silent to not call clickListner
  moveClickMarker(
    position: google.maps.LatLng | google.maps.LatLngLiteral,
    silent = false
  ) {
    if (this.clickMarker && this.clickMarker.getVisible()) {
      this.clickMarker.setPosition(position);
      this.map.panTo(position);
      this.markers.forEach(marker => {
        marker.setIcon(red);
      });
      this.infoWindow.close();
      if (this.clickListner && !silent) {
        this.clickListner(this.forceLatLngLiteral(position));
      }
    }
  }

  // Creates a search box, allowing for the searching of places
  addSearchBox(element: ElementRef) {
    this.searchBox = new GoogleMap.api.places.SearchBox(element.nativeElement);
    this.searchMarkers = [];

    // Bias the SearchBox results towards current map's viewport.
    this.map.addListener("bounds_changed", () => {
      this.searchBox.setBounds(this.map.getBounds());
    });

    // On search, clear old result markers and add new ones
    this.searchBox.addListener("places_changed", () => {
      this.searchMarkers.forEach(marker => this.removeMarker(marker));
      this.searchMarkers = this.searchBox.getPlaces().map(place => {
        return this.overlayMarker(place.geometry.location, place.name);
      });
    });
  }

  // creates a marker, overlaying it on the map
  // adjusts map center and bounds to fit all markers
  // returns the new marker object
  overlayMarker(
    position: google.maps.LatLng | google.maps.LatLngLiteral,
    content: string | Node
  ): google.maps.Marker {
    const marker: google.maps.Marker = new GoogleMap.api.Marker({
      position,
      map: this.map,
      icon: red
    });
    marker.addListener("click", _ => {
      if (content) {
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      }
      if (this.clickMarker) {
        this.clickMarker.setVisible(false);
        marker.setIcon(blue);
      }
      if (this.clickListner) {
        this.clickListner(this.forceLatLngLiteral(marker.getPosition()));
      }
    });
    this.markers.add(marker);
    this.bounds.extend(position);
    if (this.autoFitMarkers) {
      this.fitToBounds();
    }
    return marker;
  }

  // removes a marker from the map
  // re-calculates bounds and adjusts display
  removeMarker(marker: google.maps.Marker): void {
    marker.setMap(null);
    this.markers.delete(marker);
    this.bounds = new GoogleMap.api.LatLngBounds();
    this.markers.forEach(m => {
      this.bounds.extend(m.getPosition());
    });
    if (this.autoFitMarkers) {
      this.fitToBounds();
    }
  }

  // makes the map nicely fit all of its markers
  private fitToBounds(): void {
    if (!this.bounds.isEmpty()) {
      this.map.setCenter(this.bounds.getCenter());
      this.map.fitBounds(this.bounds);
      if (this.map.getZoom() > this.maxZoomAfterFitBounds) {
        this.map.setZoom(this.maxZoomAfterFitBounds);
      }
    }
  }

  // Use to make sure coordinate pair is a LatLngLiteral
  private forceLatLngLiteral(
    latLng: google.maps.LatLng | google.maps.LatLngLiteral
  ) {
    if ((<google.maps.LatLng>latLng).equals) {
      return {
        lat: (<google.maps.LatLng>latLng).lat(),
        lng: (<google.maps.LatLng>latLng).lng()
      };
    }
    return <google.maps.LatLngLiteral>latLng;
  }
}
