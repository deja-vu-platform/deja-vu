/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
declare module '*.json' {
  const value: any;
  export default value;
}
// convince TS that Array.flat exists
// note that this type definition ignores the depth parameter
interface Array<T> {
  flat<U>(this: U[][]): U[];
}