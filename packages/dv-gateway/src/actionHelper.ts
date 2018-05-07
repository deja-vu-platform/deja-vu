import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as RJSON from 'relaxed-json';

export type ActionAst = ReadonlyArray<ActionTag>;
export interface InputMap {
  [name: string]: string; /* expr */
}

export interface ActionTag {
  readonly fqtag: string;
  readonly dvOf?: string;
  readonly dvAlias?: string;
  readonly tag: string;
  readonly inputs?: InputMap;
  readonly context?: InputMap;
  readonly content?: ActionAst;
}

export interface ActionTable {
  readonly [tag: string]: ActionAst;
}

// From dv-core
export interface FieldMap {
  [field: string]: string;
}
export interface ActionInput {
  tag: string;
  // Optional value to specify the cliche the action is from
  dvOf?: string;
  dvAlias?: string;
  // A map of (adapter input name) -> (action input name)
  inputMap?: FieldMap;
  // A map of input names to exprs
  inputs?: FieldMap;
}

const ACTION_TABLE_FILE_NAME = 'actionTable.json';


export class ActionHelper {
  private readonly actionTable: ActionTable;
  constructor(appActionTable: ActionTable, usedCliches: string[]) {
    const clicheActionTables: ActionTable[] = _.map(
        _.uniq(usedCliches), this.getActionTableOfCliche.bind(this));
    const allActionsTable = _.assign({}, appActionTable, ...clicheActionTables);

    // Prune the action table to have only used actions
    // TODO: instead of adding all app actions, use the route information
    const usedActions = new Set<string>(_.keys(appActionTable));
    const getUsedActions = (actionAst: ActionAst | undefined): void => {
      _.each(actionAst, (action: ActionTag) => {
        if (action.tag === 'dv-include' ||
            this.clicheOfTag(action.tag) !== 'dv') {
          usedActions.add(action.tag);
        }
        getUsedActions(this.getActionContent(action, allActionsTable).content);
      });
    };
    _.each(_.values(appActionTable), getUsedActions);

    this.actionTable = _.pick(allActionsTable, Array.from(usedActions));
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
   * @returns the `ActionTag`s corresponding to the last node of the action path
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
      const action = this.getActionContent(matchingNode, this.actionTable);

      return this._getMatchingActions(actionPath.slice(1), action.content);
    });
  }

  /**
   *  @param actionTag - the action tag to get the content form
   *  @param actionTable - the action table to use to retrieve the content
   *  @returns an `ActionTag` representing the given action tag but with its
   *    content populated
   */
  private getActionContent(actionTag: ActionTag, actionTable: ActionTable)
    : ActionTag {
    if (actionTag.tag === 'dv-include') {
      return {
        fqtag: actionTag.fqtag,
        tag: actionTag.tag,
        content: _.map(
          [this.getIncludedActionTag(actionTag)], (at: ActionTag) => {
          return {...at, context: {}};
        }),
        context: actionTag.context
      };
    } else if (this.clicheOfTag(actionTag.tag) === 'dv') {
      return actionTag;
    } else {
      return {
        fqtag: actionTag.fqtag,
        tag: actionTag.tag,
        content: _.map(actionTable[actionTag.tag], (at: ActionTag) => {
          return {...at, context: actionTag.inputs};
        }),
        context: actionTag.context
      };
    }
  }

  /**
   *  Get the fully qualified tag for the given tag.
   */
  private getFqTag(
    tag: string, dvOf: string | undefined,
    dvAlias: string | undefined): string {
    if (dvAlias) {
      return dvAlias;
    }
    let [clicheName, ...actionTagName] = tag.split('-');
    if (dvOf) { clicheName = dvOf; }

    return clicheName + '-' + actionTagName.join('-');
  }

  /**
   *  Determine the included action tag from a `dv-include` action tag
   *
   *  @param includeActionTag - the action tag to get the included action from
   *  @returns the included action tag
   */
  private getIncludedActionTag(includeActionTag: ActionTag): ActionTag {
    const noActionErrorMsg = (cause: string) => `
      Couldn't find the included action in ${JSON.stringify(includeActionTag)}:
      ${cause} \n Context is ${JSON.stringify(includeActionTag.context)}
    `;
    const actionExpr: string = _.get(includeActionTag.inputs, '[action]');
    if (_.isEmpty(actionExpr)) {
      throw new Error(noActionErrorMsg('no action input'));
    }
    let ret: ActionTag;
    if (_.has(includeActionTag.context, `[${actionExpr}]`)) {
      // action is not the default one
      let inputObj: ActionInput, tag: string;
      try {
        inputObj = RJSON.parse(
          _.get(includeActionTag.context, `[${actionExpr}]`)) as ActionInput;
        tag = _.kebabCase(inputObj.tag);
      } catch (e) {
        throw new Error(noActionErrorMsg('Expected object with tag field'));
      }
      ret = {
        fqtag: this.getFqTag(tag, inputObj.dvOf, inputObj.dvAlias),
        tag: tag,
        dvOf: inputObj.dvOf,
        dvAlias: inputObj.dvAlias,
        inputs: _.assign({},
          _.mapValues(_.invert(inputObj.inputMap), (value) => {
            return _.get(includeActionTag.context, value);
          }),
          ..._.get(inputObj, 'inputs', [])),
        context: {}
      };

    } else {  // action is the default one
      const tag = _.get(includeActionTag, 'inputs.tag');
      const dvOf = _.get(includeActionTag, 'inputs.dvOf');
      const dvAlias = _.get(includeActionTag, 'inputs.dvAlias');
      const inputs = _.get(includeActionTag, 'inputs.inputs');
      ret = {
        fqtag: this.getFqTag(tag, dvOf, dvAlias),
        tag: tag,
        dvOf: dvOf,
        dvAlias: dvAlias,
        inputs: inputs ? RJSON.parse(inputs) : undefined,
        context: {}
      };
    }

    return ret;
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
