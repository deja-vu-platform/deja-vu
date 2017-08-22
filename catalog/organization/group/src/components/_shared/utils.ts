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
  } else if (maxt > 0) {
    maxt -= dvec[0];
    for (let i = 0; i < dvec.length-1; i += 1) {
      dvec[i] += dvec[i+1];
    }
    return timeout(dvec[0]).then(_ => waitFor(obj, fld, truthy, maxt, dvec));
  } else {
    return Promise.reject(`Timeout waiting for field ${fld} in object.`);
  }
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

// inserts an HTML tag with the given attributes
export function insertTag(tagName: string, attributes: object): void {
  const s = document.createElement(tagName);
  Object.keys(attributes).forEach(key => s[key] = attributes[key]);
  document.getElementsByTagName("body")[0].appendChild(s);
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


// returns a promise which resolves after delay
function timeout(delay: number): Promise<{}> {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}
