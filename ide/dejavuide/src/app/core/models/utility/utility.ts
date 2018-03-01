const uuidv4 = require('uuid/v4');

export function generateId(): string {
  // use the full number!
  return uuidv4();
}

export function shallowCopy(obj: any): any {
  // Object.assign causes aliasing issues
  return JSON.parse(JSON.stringify(obj || {}));
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  top: number;
  left: number;
}
