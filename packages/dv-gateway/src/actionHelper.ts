import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import 'lodash.product';

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

export type ActionTagPath = ActionTag[];

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
const CONFIG_FILE_NAME = 'dvconfig.json';


export class ActionHelper {
  private readonly actionTable: ActionTable;
  private readonly actionsNoExecRequest: Set<string>;

  /**
   *  @returns get the fully qualified tag for the given tag.
   */
  private static GetFqTag(
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
   *  @returns the included action tag or `null` if there's no included tag.
   *    It is `null` if there is no default action and the user hasn't
   *    provided one as input
   */
  private static GetIncludedActionTag(includeActionTag: ActionTag)
    : ActionTag | null {
    const noActionErrorMsg = (cause: string) => `
      Couldn't find the included action in ${JSON.stringify(includeActionTag)}:
      ${cause} \n Context is ${JSON.stringify(includeActionTag.context)}
    `;
    const actionExpr: string = _.get(includeActionTag.inputs, '[action]');
    if (_.isEmpty(actionExpr)) {
      throw new Error(noActionErrorMsg('no action input'));
    }
    let ret: ActionTag | null = null;
    if (_.has(includeActionTag.context, `[${actionExpr}]`)) {
      // action is not the default one
      let inputObj: ActionInput;
      const actionObj = _.get(includeActionTag.context, `[${actionExpr}]`);
      try {
        inputObj = RJSON.parse(actionObj) as ActionInput;
      } catch (e) {
        throw new Error(noActionErrorMsg(
          `Action is not the default one
           Expected action object but found ${actionObj}`));
      }
      if (_.isEmpty(inputObj.tag)) {
        throw new Error(noActionErrorMsg(
          `Action is not the default one
           Missing 'tag' in ${actionObj}`));
      }
      const tag: string = _.kebabCase(inputObj.tag);
      ret = {
        fqtag: ActionHelper.GetFqTag(tag, inputObj.dvOf, inputObj.dvAlias),
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

    } else if (!_.has(includeActionTag, 'inputs.no-default')) {
      // action has a default
      const tag = _.get(includeActionTag, 'inputs.tag');
      if (_.isEmpty(tag)) {
        throw new Error(noActionErrorMsg(
          'Expected default action to have tag attribute'));
      }
      const dvOf = _.get(includeActionTag, 'inputs.dvOf');
      const dvAlias = _.get(includeActionTag, 'inputs.dvAlias');
      const inputs = _.get(includeActionTag, 'inputs.inputs');
      ret = {
        fqtag: ActionHelper.GetFqTag(tag, dvOf, dvAlias),
        tag: tag,
        dvOf: dvOf,
        dvAlias: dvAlias,
        inputs: inputs ? RJSON.parse(inputs) : undefined,
        context: {}
      };
    }

    return ret;
  }

  /**
   * @return the action table of the given cliche
   */
  private static GetActionTableOfCliche(cliche: string): ActionTable {
    const fp = path.join('node_modules', cliche, ACTION_TABLE_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8'));
  }

  /**
   * @return the set of actions from the given cliche that are not expected to
   * issue a request
   */
  private static GetActionsNoRequest(cliche: string)
    : { exec: string[] } | undefined {
    const fp = path.join('node_modules', cliche, CONFIG_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8')).actionsNoRequest;
  }

  /**
   * @returns the cliche of the action represented by the given tag
   */
  private static ClicheOfTag(tag: string) {
    return tag.split('-')[0];
  }

  /**
   * @returns true if the given action is the built-in include action
   */
  private static IsDvIncludeAction(action: ActionTag) {
    return action.tag === 'dv-include';
  }

  /**
   * @returns true if the given action is a built-in action
   */
  private static IsDvAction(action: ActionTag) {
    return ActionHelper.ClicheOfTag(action.tag) === 'dv';
  }


  constructor(
    appActionTable: ActionTable, usedCliches: string[],
    private readonly routes: { path: string, action: string }[] | undefined) {
    const clicheActionTables: ActionTable[] = _.map(
        _.uniq(usedCliches), ActionHelper.GetActionTableOfCliche);
    const allActionsTable = _.assign({}, appActionTable, ...clicheActionTables);
    console.log(
      `Unpruned action table ${JSON.stringify(allActionsTable, null, 2)}`);

    // Prune the action table to have only used actions
    // TODO: instead of adding all app actions, use the route information
    const usedActions = new Set<string>(_.keys(appActionTable));
    const seenActions = new Set<string>();
    const getUsedActions = (
      actionAst: ActionAst | undefined, debugPath: string[] = []): void => {
      _.each(actionAst, (action: ActionTag) => {
        debugPath.push(action.fqtag);
        if (!ActionHelper.IsDvAction(action)) {
          if (seenActions.has(action.tag)) {
            return;
          }
          seenActions.add(action.tag);
        }
        if (ActionHelper.IsDvIncludeAction(action) ||
            !ActionHelper.IsDvAction(action)) {
          usedActions.add(action.tag);
        }

        try {
          const actionWithContent = this
            .populateActionContent(action, allActionsTable);

          getUsedActions(actionWithContent.content, debugPath);
        } catch (e) {
          throw new Error(`Path: ${debugPath}\n${e.message}`);
        }
      });
    };
    const rootActions = _.map(
      _.keys(appActionTable),
      (tag) => {
        return this
          .populateActionContent({ fqtag: tag, tag: tag }, allActionsTable);
      });
    _.each(rootActions, (rootAction) => getUsedActions(rootAction.content));

    this.actionTable = _.pick(allActionsTable, Array.from(usedActions));
    console.log(
      `Using action table ${JSON.stringify(this.actionTable, null, 2)}`);

    this.actionsNoExecRequest = new Set<string>(
      _.flatMap(usedCliches, (cliche: string) => _.get(
      ActionHelper.GetActionsNoRequest(cliche), 'exec', [])));
  }

  /**
   * @returns true if the action given by `tag` is expected to do an exe
   * request
   */
  shouldHaveExecRequest(tag: string): boolean {
    return !this.actionsNoExecRequest.has(tag);
  }

  /**
   * @returns the `ActionTag` corresponding to the given action path
   */
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

  /**
   * @returns true if the given action path is expected
   */
  actionPathIsValid(actionPath: string[]): boolean {
    return !_.isEmpty(this.getMatchingActions(actionPath));
  }

  /**
   * @returns the `ActionTag`s corresponding to the last node of the action path
   */
  getMatchingActions(actionPath: string[]): ActionTag[] {
    return _.map(this.getMatchingPaths(actionPath), _.last);
  }

  /**
   * @returns the `ActionTag`s corresponding to the given action path
   */
  getMatchingPaths(actionPath: string[]): ActionTagPath[] {
    const firstTag = actionPath[0];
    if (_.isEmpty(actionPath) || !(firstTag in this.actionTable)) {
      return [];
    }
    const matchingNode: ActionTag = this.populateActionContent(
      { fqtag: firstTag, tag: firstTag }, this.actionTable);
    if (actionPath.length === 1 && firstTag in this.actionTable) {
      return [[ matchingNode ]] ;
    }

    return _.map(
      this._getMatchingPaths(actionPath.slice(1), matchingNode.content),
      (matchingPath: ActionTagPath) => [ matchingNode, ...matchingPath ]);
  }

  private _getMatchingPaths(
    actionPath: string[], actionAst: ActionAst | undefined)
    : ActionTagPath[] {
    // actionPath.length is always >= 1

    if (_.isEmpty(actionAst)) {
      return [];
    }
    const matchingNodes: ActionTag[] = _.map(
      _.filter(actionAst, (at: ActionTag) => at.fqtag === actionPath[0]),
      (matchingNode: ActionTag) => this.populateActionContent(
        matchingNode, this.actionTable));

    if (actionPath.length === 1) {
      return _.map(
        matchingNodes,
        (matchingNode: ActionTag): ActionTagPath => [ matchingNode ]);
    }

    return _.flatMap(
      matchingNodes,
      (matchingNode: ActionTag): ActionTagPath[] =>  _.map(
        this._getMatchingPaths(actionPath.slice(1), matchingNode.content),
        (matchingPath: ActionTagPath) => [ matchingNode, ...matchingPath ]));
  }

  /**
   *  @param actionTag - the action tag to get the content from
   *  @param actionTable - the action table to use to retrieve the content
   *  @returns an `ActionTag` representing the given action tag but with its
   *    content populated
   */
  private populateActionContent(actionTag: ActionTag, actionTable: ActionTable)
    : ActionTag {
    let ret;
    if (ActionHelper.IsDvIncludeAction(actionTag)) {
      const includedActionTag: ActionTag | null = ActionHelper
        .GetIncludedActionTag(actionTag);

      ret = {
        fqtag: actionTag.fqtag,
        tag: actionTag.tag,
        content: (includedActionTag === null) ? [] :
          [{...includedActionTag, context: {}}],
        context: actionTag.context
      };
    } else if (ActionHelper.IsDvAction(actionTag)) {
      ret = actionTag;
    } else {
      ret = {
        fqtag: actionTag.fqtag,
        tag: actionTag.tag,
        content: _.map(actionTable[actionTag.tag], (at: ActionTag) => {
          return {...at, context: actionTag.inputs};
        }),
        context: actionTag.context
      };
    }
    // https://angular.io/guide/router
    // The router adds the <router-outlet> element to the DOM and subsequently
    // inserts the navigated view element immediately after the <router-outlet>.
    const contentTags: string[] = _.map(ret.content, 'tag');
    if (_.includes(contentTags, 'router-outlet')) {
      const routeActions: ActionTag[] = this.getRouteActions(actionTable);
      ret.content = _.concat(ret.content, routeActions);
    }

    return ret;
  }

  /**
   * @returns an array [action_1, action_2, ..., action_n] representing an
   * action path from action_1 to action_n where action_n is the action that
   * originated the request. An action path is a DOM path that includes only
   * actions (it filters HTML elements like div)
   */
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

  /**
   * @returns true if the given action path is inside a dv transaction
   */
  isDvTx(actionPath: string[]) {
    return _.includes(actionPath, 'dv-tx');
  }

  toString() {
    return JSON.stringify(this.actionTable, null, 2);
  }

  /**
   * @return a list of `ActionTag`s, one for each route
   */
  private getRouteActions(actionTable: ActionTable): ActionTag[] {
    return _.map(this.routes, (route) => {
      if (!_.has(actionTable, route.action)) {
        throw new Error(`Route action ${route.action} doesn't exist`);
      }

      return {
        fqtag: route.action,
        tag: route.action,
        content: actionTable[route.action],
        context: {}
      };
    });
  }
}
