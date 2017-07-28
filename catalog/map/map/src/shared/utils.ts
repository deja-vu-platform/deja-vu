const MIN_ZOOM = 3;
const MAX_ZOOM = 20;

const INIT_CENTER = {lat: 42.35920, lng: -71.09315}; // MIT
const INIT_ZOOM = 16;

const MAX_ZOOM_AFTER_FIT_BOUNDS = 18;

// waitFor waits forever, trying rapidly at first and slowing exponentially
// see waitFor spec for more details
const DEF_MAXT = Infinity;
const DEF_DVEC = [10, 1, 1];

// TODO: Not hardcoded key
const GOOGLE_MAPS_API_KEY = "AIzaSyBbPL7hviCiMdW7ZkIuq119PuidXV0epwY";

// TODO: Local files
export const MARKER_ICONS = {
  RED: "http://maps.google.com/mapfiles/ms/icons/red.png",
  BLUE: "http://maps.google.com/mapfiles/ms/icons/blue.png"
};


// EXPORTED FUNCTIONS

// If needed, loads Google Maps API scripts
// Returns a promise containing the api
export function getGoogleMapsAPI() {
  // see if google maps api needs to be loaded on the page
  // flag is used rather than checking for api to avoid async issues
  if (!window["didLoadGoogleMapsAPI"]) {
    window["didLoadGoogleMapsAPI"] = true;
    initGoogleMapsAPI();
  }

  return waitFor(window, "gmapsAPI")
    .then(_ => Promise.resolve(window["gmapsAPI"]))
    .catch(_ => Promise.reject("Unable to retrieve Google Maps API"));
}

// creates a map object, installing it in an element with given id
// returns a promise containing the element
export function newMapObject(gmaps, map_id: string) {
  return waitFor(window, map_id)
    .then(_ => {
      const mapElement = document.getElementById(map_id);
      const map = new gmaps.Map(mapElement, {
        zoom: INIT_ZOOM,
        center: INIT_CENTER,
        streetViewControl: false,
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM
      });
      map["dvInfoWindow"] = new gmaps.InfoWindow;
      map["dvBounds"] = new gmaps.LatLngBounds();
      map["dvMarkers"] = new Set();
      window["mapObj-"+map_id] = map;
      map.addListener("click", _ => map["dvInfoWindow"].close());
      return Promise.resolve(map);
    })
    .catch(_ => Promise.reject("Unable to retrieve DOM element with given ID"));
}

// Returns a promise containing the map object with map_id
export function getMapObject(map_id: string) {
  return waitFor(window, "mapObj-"+map_id)
    .then(_ => Promise.resolve(window["mapObj-"+map_id]))
    .catch(_ => Promise.reject("Unable to retrieve map with id " + map_id));
}

// creates a marker, overlaying it on the map
// adjusts map center and bounds to fit all markers
// returns the new marker object
export function overlayMarker(
  gmaps, map, pos: {lat: number, lng: number}, title?: string
) {
  const latlng = new gmaps.LatLng(pos.lat, pos.lng);
  const marker = new gmaps.Marker({
    position: latlng,
    map: map,
    icon: MARKER_ICONS.RED,
    title: title
  });
  map["dvMarkers"].add(marker);
  map["dvBounds"].extend(latlng);
  fitToBounds(map, map["dvBounds"]);
  return marker;
}

// removes an overlayed marker from the map
// correctly adjusts center and bounds of map
export function removeMarker(gmaps, marker) {
  const map = marker.getMap();
  marker.setMap(null);
  map["dvMarkers"].delete(marker);
  map["dvBounds"] = new gmaps.LatLngBounds();
  map["dvMarkers"].forEach(m => {
    map["dvBounds"].extend(m.getPosition());
  });
  fitToBounds(map, map["dvBounds"]);
}

export function getInfoWindow(map) {
  return map["dvInfoWindow"];
}

// waits for a field of an object `obj[fld]` to be truthy
// returns a promise
//   the promise resolves once the field is truthy
//     the single value given to the promise's callback is `ret`
//   the promise rejects after `maxt` msec
// dvec is a vector of derivatives
//   [0] = number of msec to wait between tries
//   [i] = amount to increase [i-1] by after each try, i > 0
export function waitFor(
  obj: object, fld: string, ret?, maxt=DEF_MAXT, dvec=DEF_DVEC
) {
  if (obj[fld]) {
    return Promise.resolve(ret);
  }
  if (maxt > 0) {
    maxt -= dvec[0];
    for (let i = 0; i++; i < dvec.length-1) {
      dvec[i] += dvec[i+1];
    }
    return timeout(dvec[0]).then(_ => waitFor(obj, fld, ret, maxt, dvec));
  } else {
    return Promise.reject("Timeout waiting for field " + fld + " in object.");
  }
}

// UUID version 4 string generator (useful for making a map_id)
// source: https://gist.github.com/kaizhu256/4482069
export function uuidv4() {
  var uuid = "", ii;
  for (ii = 0; ii < 32; ii += 1) {
    switch (ii) {
    case 8:
    case 20:
      uuid += "-";
      uuid += (Math.random() * 16 | 0).toString(16);
      break;
    case 12:
      uuid += "-";
      uuid += "4";
      break;
    case 16:
      uuid += "-";
      uuid += (Math.random() * 4 | 8).toString(16);
      break;
    default:
      uuid += (Math.random() * 16 | 0).toString(16);
    }
  }
  return uuid;
}


// HELPER FUNCTIONS

// loads the google maps api onto the page, so we can get it here
function initGoogleMapsAPI() {
  // Script to allow us to access google maps api in this file
  const init_script = `
    function afterInitGoogleMapsAPI() {
      window["gmapsAPI"] = google.maps;
    }
  `;

  // Build URL for Google Maps API
  const key = GOOGLE_MAPS_API_KEY; // TODO: Not hardcoded key
  const callback = "afterInitGoogleMapsAPI";
  const gmap_script = "https://maps.googleapis.com/maps/api/js?key=" + key +
    "&libraries=places&callback=" + callback;

  // Google map scripts need to be loaded this way
  insertScript(init_script);
  loadRemoteScript(gmap_script);
}

// fits a map to its bounds, handling special cases
function fitToBounds(map, bounds) {
  if (!bounds.isEmpty()) {
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
    if (map.getZoom > MAX_ZOOM_AFTER_FIT_BOUNDS) {
      map.setZoom(MAX_ZOOM_AFTER_FIT_BOUNDS);
    }
  }
}

// returns a promise which resolves after delay
function timeout(delay: number) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}

// inserts a script tag containing a script literal
function insertScript(scriptLiteral: string) {
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.innerHTML = scriptLiteral;
  document.getElementsByTagName("body")[0].appendChild(s);
}

// inserts a script tag that loads a remote script
function loadRemoteScript(src: string) {
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.src = src;
  s.async = true;
  s.defer = true;
  document.getElementsByTagName("body")[0].appendChild(s);
}
