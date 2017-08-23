// EXPORTED FUNCTIONS

// waits for a field of an object `obj[fld]` to be defined and non-null
// returns a promise which
//   resolves with `obj[fld]` once available
//   rejects after `maxt` msec
// if `truthy` is true, resolution requires `obj[fld]` to also be truthy
// `dvec` is a vector of derivatives where
//   `dvec[i]` = number of msec to wait between tries, i = 0
//             = amount to increase `dvec[i-1]` by after each try, i > 0
export function waitFor(
  obj: object,
  fld: string,
  truthy=false,
  maxt=Infinity,
  dvec=[10,1,1]
) : Promise<any> {
  if (obj[fld] !== undefined && obj[fld] !== null && (!truthy || obj[fld])) {
    return Promise.resolve(obj[fld]);
  }
  if (maxt > 0) {
    maxt -= dvec[0];
    for (let i = 0; i < dvec.length-1; i += 1) {
      dvec[i] += dvec[i+1];
    }
    return timeout(dvec[0]).then(_ => waitFor(obj, fld, truthy, maxt, dvec));
  } else {
    return Promise.reject("Timeout waiting for field " + fld + " in object.");
  }
}

// inserts a script tag that loads Javascript
export function loadScript(src: string): void {
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.src = src;
  s.id = src;
  document.getElementsByTagName("body")[0].appendChild(s);
}

// inserts a style tag that loads a CSS stylesheet
export function loadStylesheet(path: string): void {
  const s = document.createElement("link");
  s.type = "text/css";
  s.rel = "stylesheet";
  s.href = path;
  s.id = path;
  document.getElementsByTagName("body")[0].appendChild(s);
}


// HELPER FUNCTIONS

// returns a promise which resolves after delay msec
function timeout(delay: number): Promise<{}> {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}
