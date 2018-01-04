export function generateId(): string {
  // use the full number!
  return Math.floor(Math.random() * 1000 * 1000 * 1000 * 1000 * 1000)
    .toString();
}

export function shallowCopy(obj: any): any {
  // Object.assign causes aliasing issues
  return JSON.parse(JSON.stringify(obj || {}));
}

export function inArray(val, arr) {
  return (arr.indexOf(val) >= 0);
}

function downloadObject(filename, obj) {
  const element = document.createElement('a');
  const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj));

  element.setAttribute('href', data);
  element.setAttribute('download', filename);

  element.click();
}
