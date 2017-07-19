// Loads Google Maps API scripts
// Places the API in window["gmaps"]
// returns a promise containing the api
export function initGoogleMapsAPI() {
  // Script to allow us to access google maps api in this file
  const init_script = `
    function afterInitGoogleMapsAPI() {
      window["gmapsAPI"] = google.maps;
    }
  `;

  // Build URL for Google Maps API
  const key = "AIzaSyBbPL7hviCiMdW7ZkIuq119PuidXV0epwY"; // TODO: pass-in key
  const callback = "afterInitGoogleMapsAPI";
  const gmap_script = "https://maps.googleapis.com/maps/api/js?key=" + key +
    "&callback=" + callback;

  // Google map scripts need to be loaded this way
  insertScript(init_script);
  loadRemoteScript(gmap_script);
  return getGoogleMapsAPI();
}

// Returns a promise containing the Google Maps API
export function getGoogleMapsAPI(dt=10, maxt=5000) {
  return waitFor(window, "gmapsAPI")
    .then(_ => Promise.resolve(window["gmapsAPI"]))
    .catch(_ => Promise.reject("Unable to retrieve Google Maps API"));
}

// creates a map object, installing it in an element with given id
// returns a promise containing the element
export function newMapObject(gmaps: any, map_id: string, dt=10, maxt=5000) {
  const mapElement = document.getElementById(map_id);
  if (mapElement) {
    const mit = {lat: 42.35920, lng: -71.09315};
    const mapObj = new gmaps.Map(mapElement, {
      zoom: 16,
      center: mit,
      streetViewControl: false
    });
    window["mapObj-"+map_id] = mapObj;
    return Promise.resolve(mapObj);
  } else if (maxt > 0) {
    maxt -= dt;
    return timeout(dt).then(_ => newMapObject(gmaps, map_id, dt, maxt));
  } else {
    return Promise.reject("Unable to create with id " + map_id);
  }
}

// Returns a promise containing the map object with map_id
export function getMapObject(map_id: string, dt=10, maxt=5000) {
  const mapObj = window["mapObj-"+map_id];
  if (mapObj) {
    return Promise.resolve(mapObj);
  } else if (maxt > 0) {
    maxt -= dt;
    return timeout(dt).then(_ => getMapObject(map_id, dt, maxt));
  } else {
    return Promise.reject("Unable to retrieve map with id " + map_id);
  }
}

// returns a promise which resolves after delay
function timeout(delay: number) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}

// waits for a field of an object to be truthy
// returns a promise which resolves once the field is truthy, returning ret
export
function waitFor(obj: object, fld: string, ret?: any, dt=10, maxt=5000) {
  if (obj[fld]) {
    return Promise.resolve(ret);
  }
  if (maxt > 0) {
    maxt -= dt;
    return timeout(dt).then(_ => waitFor(obj, fld, ret, dt, maxt));
  } else {
    return Promise.reject("Timeout waiting for field " + fld + " in object.");
  }
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
