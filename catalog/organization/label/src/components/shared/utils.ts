const scriptSrc = "https://cdn.jsdelivr.net/select2/4.0.3/js/select2.min.js";
const stylePath = "https://cdn.jsdelivr.net/select2/4.0.3/css/select2.min.css";


// EXPORTED FUNCTIONS

export function addTypeahead(
  selectID: string,
  options: object
): Promise<void> {
  // insert tags to load API and styles from CDN
  if (!window[scriptSrc] && !window["jQuery"].fn.select2) {
    loadScript(scriptSrc);
  }
  if (!window[stylePath]) {
    loadStylesheet(stylePath);
  }

  // wait for APIs to load, then use them
  return waitFor(window, "jQuery")
    .then(_ => waitFor(window["jQuery"].fn, "select2"))
    .then(_ => {
      const $ = window["jQuery"];

      // installs typeahead in DOM element
      $(`#${selectID}`).select2(options);
    });
}

// gets the current value of a typeahead
export function getTypeaheadVal(selectID: string): string[] {
  return window["jQuery"](`#${selectID}`)
    .select2("data")
    .map(datum => datum.text);
}

// sets the value of a typeahead
export function setTypeaheadVal(selectID: string, val: string[] | null) {
  window["jQuery"](`#${selectID}`).val(val).trigger("change");
}

// UUID version 4 string generator
// source: https://gist.github.com/kaizhu256/4482069
export function uuidv4(): string {
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

// allows references like `foo.bar.baz` to be done without fear of error
// returns objct[flds[0]][flds[1]]...
// or dflt if a field access is attempted on null or undefined
export function getOrDefault<T>(objct: object, flds: string[], dflt: T): T {
  let broke = false;
  let obj: any = objct;
  flds.forEach((fld) => {
    if (obj !== null && obj !== undefined) {
      obj = obj[fld];
    } else {
      broke = true;
    }
  });
  return (broke ? dflt : obj);
}


// HELPER FUNCTIONS

// waits for a field of an object `obj[fld]` to be truthy
// returns a promise
//   the promise resolves once the field is truthy
//     the single value given to the promise's callback is `ret`
//   the promise rejects after `maxt` msec
// dvec is a vector of derivatives
//   [0] = number of msec to wait between tries
//   [i] = amount to increase [i-1] by after each try, i > 0
function waitFor<T>(
  obj: object, fld: string, ret?: T, maxt=Infinity, dvec=[10,1,1]
) : Promise<T> {
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

// returns a promise which resolves after delay
function timeout(delay: number): Promise<{}> {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}

// inserts a script tag that loads a remote script
function loadScript(src: string): void {
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.src = src;
  s.id = src;
  document.getElementsByTagName("body")[0].appendChild(s);
}

// inserts a style tag that loads a local stylesheet
export function loadStylesheet(path: string): void {
  const s = document.createElement("link");
  s.type = "text/css";
  s.rel = "stylesheet";
  s.href = path;
  s.id = path;
  document.getElementsByTagName("body")[0].appendChild(s);
}
