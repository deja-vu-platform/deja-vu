import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

export type ActionAst = ReadonlyArray<ActionTag>;

export interface ActionTag {
  readonly fqtag: string;
  readonly dvOf?: string;
  readonly dvAlias?: string;
  readonly tag: string;
  readonly inputs?: {[name: string]: string} /* expr */;
  readonly content?: ActionAst;
}

export interface ActionTable {
  readonly [tag: string]: ActionAst;
}

const ACTION_TABLE_FILE_NAME = 'actionTable.json';

// Having the same action as a child more than once is a problem for
// dv-tx nodes because we can't tell apart the requests. It is also
// a problem if we have sibling dv-tx nodes with the same child action for the
// same reason. When we encounter an ambigous path we throw an error. The
// solution is for the user to alias the dv-tx or the duplicated action.
export class ActionHelper {
  private readonly actionTable: ActionTable;
  constructor(
    appName: string, appActionTable: ActionTable,
    usedCliches: {[alias: string]: string}) {
    // The table should only contain actions that are reachable from the app
    const usedClicheActions = new Set<string>();
    const getUsedClicheActions = (actionAst: ActionAst | undefined): void => {
      _.each(actionAst, (action: ActionTag) => {
        const cliche = this.clicheOfTag(action.tag);
        switch (cliche) {
          case appName:
            return;
          case 'dv':
            getUsedClicheActions(action.content);
            break;
          default:
            usedClicheActions.add(action.tag);
            getUsedClicheActions(action.content);
            break;
        }
      });
    };
    _.each(_.values(appActionTable), getUsedClicheActions);

    const usedClicheNames = new Set<string>(_.values(usedCliches));
    this.actionTable = {
      ...appActionTable,
      // Add the used cliche actions to the table
      ..._.fromPairs(_.map(
        Array.from(usedClicheActions),
        (tag: string): [string, ActionAst] => {
          const cliche = this.clicheOfTag(tag);
          if (!usedClicheNames.has(cliche)) {
            throw new Error(`No cliche ${cliche} in use`);
          }
          const clicheActionTable = this.getActionTableOfCliche(cliche);
          if (!(tag in clicheActionTable)) {
            throw new Error(`Cliche ${cliche} has no action ${tag}`);
          }

          return [ tag, clicheActionTable[tag] ];
        }))
    };
  }

  private getActionTableOfCliche(cliche: string): ActionTable {
    return JSON.parse(readFileSync(
      path.join('node_modules', cliche, ACTION_TABLE_FILE_NAME), 'utf8'));
  }

  private clicheOfTag(tag: string) {
    return tag.split('-')[0];
  }

  getActionOrFail(actionPath: string[]): ActionTag {
    const ret = this.getMatchingActions(actionPath);
    if (_.isEmpty(ret)) {
      throw new Error(`No action ${actionPath} found`);
    }
    if (ret.length > 1) {
      throw new Error(`Found more than one matching action for ${actionPath}`);
    }

    return ret[0];
  }

  actionPathIsValid(actionPath: string[]): boolean {
    return !_.isEmpty(this.getMatchingActions(actionPath));
  }

  /**
   * Returns the `ActionTag` objects corresponding to the last node of the
   * action path
   */
  getMatchingActions(actionPath: string[]): ActionTag[] {
    if (_.isEmpty(actionPath) || !(actionPath[0] in this.actionTable)) {
      return [];
    } else if (actionPath.length === 1 && actionPath[0] in this.actionTable) {
      return [{
        fqtag: actionPath[0],
        tag: actionPath[0],
        content: this.actionTable[actionPath[0]]
      }];
    }

    return this._getMatchingActions(
      actionPath.slice(1), this.actionTable[actionPath[0]]);
  }

  private _getMatchingActions(
    actionPath: string[], actionAst: ActionAst | undefined): ActionTag[] {
    // actionPath.length is always >= 1

    if (_.isEmpty(actionAst)) {
      return [];
    }
    const matchingNodes = _.filter(
      actionAst, (at: ActionTag) => at.fqtag === actionPath[0]);

    if (actionPath.length === 1) {
      return matchingNodes;
    }

    return _.flatMap(matchingNodes, (matchingNode: ActionTag) => {
      const actionAst = this.clicheOfTag(matchingNode.tag) === 'dv' ?
        matchingNode.content : this.actionTable[actionPath[0]];

      return this._getMatchingActions(actionPath.slice(1), actionAst);
    });
  }

  // Returns an array [action_1, action_2, ..., action_n] representing an action
  // path from action_1 to action_n where action_n is the action that originated
  // the request.
  // Note: dv-* actions are included
  // In other words, it filters non-dv nodes from `from`
  getActionPath(from: string[], projects: Set<string>): string[] {
    return _.chain(from)
      .map((node) => node.toLowerCase())
      .filter((name) => {
        const project = name.split('-')[0];

        return projects.has(project) || project === 'dv';
      })
      .reverse()
      .value();
  }

  isDvTx(actionPath: string[]) {
    return _.includes(actionPath, 'dv-tx');
  }

  toString() {
    return JSON.stringify(this.actionTable, null, 2);
  }
}
