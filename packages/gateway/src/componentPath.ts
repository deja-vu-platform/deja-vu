import * as _ from 'lodash';


const DV_TX_TAG = 'dv-tx';
const INDENT_NUM_SPACES = 2;


/**
 * A path of components (represented by their fqtags). The first node is the root.
 *
 * An component path is a DOM path that includes only components (it filters HTML
 * elements like `div`)
 */
export class ComponentPath {
  private readonly path: ReadonlyArray<string>;

  public static fromString(from: string): ComponentPath {
    return new ComponentPath(JSON.parse(from));
  }

  /**
   * @param nodes a list of nodes starting from the component originating the req
   */
  constructor(nodes: ReadonlyArray<string>) {
    if (nodes.length < 1) {
      throw new Error(`Can't create an empty component path`);
    }
    this.path = nodes;
  }

  nodes(): ReadonlyArray<string> {
    return this.path;
  }

  first(): string {
   return this.path[0];
  }

  last(): string {
    return <string> _.last(this.path);
  }

  length(): number {
    return this.path.length;
  }

  tail(): ComponentPath {
    return new ComponentPath(_.tail(this.path));
  }

  indexOfClosestTxNode(): number | null {
    return this.indexOf(DV_TX_TAG);
  }

  /**
   * @returns true if this component path is inside a dv transaction
   */
  isDvTx(): boolean {
    return this.indexOfClosestTxNode() === this.length() - 2;
  }

  /**
   * @returns a string representing this component path. To construct a new component
   *          object from the string call `fromString`
   */
  serialize(): string {
    return JSON.stringify(this.path);
  }

  toString(): string {
    return JSON.stringify(this.path, null, INDENT_NUM_SPACES);
  }

  private indexOf(tag: string): number | null {
    const indexOfTag = _.lastIndexOf(this.path, tag);

    return indexOfTag === -1 ? null : indexOfTag;
  }
}
