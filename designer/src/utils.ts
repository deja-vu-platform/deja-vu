export function filterInPlace<T>(arr: T[], f: (e: T, i: number) => boolean) {
  let out = 0;
  for (let i = 0; i < arr.length; i += 1) {
    if (f(arr[i], i)) {
      arr[out] = arr[i];
      out += 1;
    }
  }
  arr.length = out;
  return arr;
}

export function isString(variable) {
  return (typeof variable === 'string' || variable instanceof String);
}
