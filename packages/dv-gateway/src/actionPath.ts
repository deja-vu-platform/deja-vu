import * as _ from 'lodash';


const DV_TX_TAG = 'dv-tx';

/**
 * A path of actions (represented by their fqtags). The first node is the root.
 *
 * An action path is a DOM path that includes only actions (it filters HTML
 * elements like `div`)
 */
export class ActionPath {
  private readonly path: ReadonlyArray<string>;

  public static fromString(from: string): ActionPath {
    return new ActionPath(JSON.parse(from));
  }

  /**
   * @param nodes a list of nodes starting from the action originating the req
   */
  constructor(nodes: ReadonlyArray<string>) {
    if (nodes.length < 1) {
      throw new Error(`Can't create an empty action path`);
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
    return _.last(this.path);
  }

  length(): number {
    return this.path.length;
  }

  tail(): ActionPath {
    return new ActionPath(_.tail(this.path));
  }

  indexOfTxNode(): number | null {
    return this.indexOf(DV_TX_TAG);
  }

  /**
   * @returns true if this action path is inside a dv transaction
   */
  isDvTx(): boolean {
    return this.indexOfTxNode() !== null;
  }

  /**
   * @returns a string representing this action path. To construct a new action
   *          object from the string call `fromString`
   */
  serialize(): string {
    return JSON.stringify(this.path);
  }

  toString(): string {
    return JSON.stringify(this.path, null, 2);
  }

  private indexOf(tag: string): number | null {
    const indexOfTag = _.indexOf(this.path, tag);

    return indexOfTag === -1 ? null : indexOfTag;
  }
}
