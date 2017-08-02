//const jQuerySrc = "http://code.jquery.com/jquery-3.2.1.min.js";

const typeaheadSrc = "https://cdnjs.cloudflare.com/ajax/libs"+
  "/corejs-typeahead/1.1.1/typeahead.bundle.min.js";


// EXPORTED FUNCTIONS

export function addTypeahead(wrapId: string, options: string[]): Promise<void> {
  // insert script tags to load APIs from CDNs
  //loadRemoteScript(jQuerySrc);
  loadRemoteScript(typeaheadSrc);

  // wait for APIs to load, then use them
  return waitFor(window, "jQuery")
    .then(_ => waitFor(window["jQuery"].fn, "typeahead"))
    .then(_ => waitFor(window, "Bloodhound"))
    .then(_ => {
      const $ = window["jQuery"];
      const Bloodhound = window["Bloodhound"];

      // constructs the suggestion engine
      const bhOptions = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: options
      });

      // installs typeahead in DOM element
      $(`#${wrapId} .typeahead`).typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: "options",
        source: bhOptions
      });
    });
}

// gets the current value of a typeahead
export function getTypeaheadVal(wrapId: string): string {
  return window["jQuery"](`#${wrapId} .tt-input`).typeahead("val");
}

// sets the value of a typeahead
export function setTypeaheadVal(wrapId: string, val: string): void {
  return window["jQuery"](`#${wrapId} .tt-input`).typeahead("val", val);
}

// Does an in-place filter
export function filterInPlace<T>(arr: T[], f: (elm: T) => boolean): void {
  let out = 0;
  for (let i = 0; i < arr.length; i++) {
    if (f(arr[i])) {
      arr[out++] = arr[i];
    }
  }
  arr.length = out;
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
function loadRemoteScript(src: string): void {
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.src = src;
  //s.async = true;
  //s.defer = true;
  document.getElementsByTagName("body")[0].appendChild(s);
}
