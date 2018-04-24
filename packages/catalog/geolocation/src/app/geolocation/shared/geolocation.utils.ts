const DEFAULT_DELAY_TIME_MS = 10;

/**
 * Waits for a field of an object `obj[field]` to be defined and non-null.
 * @param obj the object of interest
 * @param field the field of the object
 * @param truthValue the value of the field of the object (if defined)
 * @param maxTime the maximum time (in ms) before the promise is rejected
 * @param derivativeVec a vector of derivatives where the first index represents
 *                      the number of milliseconds to wait between tries; all
 *                      other indices represent how much to increment the
 *                      previous value by after each try.
 * @returns a promise that resolves to `obj[field]`; it is rejected after
 *          maxTime ms
 */
export function waitFor(obj: object, field: string, truthValue = false,
  maxTime = Infinity, derivativeVec = [DEFAULT_DELAY_TIME_MS, 1, 1])
  : Promise<any> {
  if ((obj[field] !== undefined)
    && (obj[field] !== null)
    && (!truthValue || obj[field])) {
    return Promise.resolve(obj[field]);
  } else if (maxTime > 0) {
    maxTime -= derivativeVec[0];

    for (let i = 0; i < derivativeVec.length - 1; i += 1) {
      derivativeVec[i] += derivativeVec[i + 1];
    }

    return timeout(derivativeVec[0])
      .then((_) => waitFor(obj, field, truthValue, maxTime, derivativeVec));
  } else {
    return Promise.reject(`Timeout waiting for field ${field} in object.`);
  }
}

/**
 * Retrieves the value for given fields of an object.
 * values.
 * @param obj the object of interest
 * @param fields the fields of an object to access
 * @param defaultResult the default value to return if any access yields
 *                      undefined or null values.
 * @returns If all fields are defined/ not-null, return the corresponding value.
 * Otherwise, return the default value.
 */
export function getOrDefault<T>(obj: object, fields: string[],
  defaultResult: T): T {
  let isNotAccessible = false;
  let objectInstance: any = obj;
  fields.forEach((field) => {
    if (objectInstance !== null && objectInstance !== undefined) {
      objectInstance = objectInstance[field];
    } else {
      isNotAccessible = true;
    }
  });

  return (isNotAccessible ? defaultResult : objectInstance);
}

// Inserts an HTML tag with the given attributes
export function insertTag(tagName: string, attributes: object): void {
  const s = document.createElement(tagName);
  Object.keys(attributes)
    .forEach((key) => s[key] = attributes[key]);
  document.getElementsByTagName('body')[0]
    .appendChild(s);
}

// Returns a promise which resolves after delay
function timeout(delay: number): Promise<{}> {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delay);
  });
}
