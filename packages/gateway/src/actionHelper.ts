import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import 'lodash.product';

import * as RJSON from 'relaxed-json';
import { ActionPath } from './actionPath';

export type ActionAst = ReadonlyArray<ActionTag>;
export interface InputMap {
  [name: string]: string; /* expr */
}

export interface ActionTag {
  readonly fqtag: string;
  readonly dvOf?: string;
  readonly dvAlias?: string;
  readonly tag: string;
  // Inputs include not only the angular inputs but also any HTML attributes
  // on the tag
  readonly inputs?: InputMap;
  readonly context?: InputMap;
  readonly content?: ActionAst;
}

export type ActionTagPath = ActionTag[];

/**
 * The action table is indexed by tag. If in the content of two actions we have
 * an action of the same tag (but different `of`, or different `alias`) there
 * would still be only one entry for that action in the table.
 */
export interface ActionTable {
  // note: this is the real action tag, not the fqtag
  readonly [tag: string]: ActionAst;
}

// From @dejavu-lang/core
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
const DV_CORE_CLICHE = '@dejavu-lang/core';
const INDENT_NUM_SPACES = 2;


export class ActionHelper {
  private readonly actionTable: ActionTable;
  private readonly actionsNoExecRequest: Set<string>;
  private readonly noApp: boolean = false;

  /**
   *  @returns get the fully qualified tag for the given tag.
   */
  private static GetFqTag(
    tag: string, dvOf: string | undefined,
    dvAlias: string | undefined): string {
    if (dvAlias) {
      return dvAlias;
    }
    // tslint:disable-next-line prefer-const
    let [clicheName, ...actionTagName] = tag.split('-');
    if (dvOf) { clicheName = dvOf; }

    return clicheName + '-' + actionTagName.join('-');
  }

  /**
   * Attempts to parse an action expression
   */
  private static ParseActionExpr(expr: string): ActionInput | string {
    const errMsg = (invalidExpr) =>
      `Expected action object or a variable but found ${invalidExpr}.` +
      `(For an object to be an action object it must have a 'tag' field)`;
    // `actionExpr` could technically be any JavaScript expression, but anything
    // other than an action input object or a variable name will be an error
    let actionExpr: any;
    try {
      actionExpr = RJSON.parse(expr);
    } catch (e) {
      throw new Error(errMsg(expr));
    }

    // We should be checking if the resulting string is actually a valid JS
    // identifier but for now checking for a string with no space should be ok.
    // This is only for returning an understandable error to the user, if it's
    // not a JS variable it will blow up somewhere else (with a cryptic error
    // message)
    const isVariable = _.isString(actionExpr) && !_.has(actionExpr, ' ');
    if (!this.IsActionInput(actionExpr) && !isVariable) {
      throw new Error(errMsg(expr));
    }

    return actionExpr;
  }

  private static IsActionInput(actionExpr: ActionInput | string)
    : actionExpr is ActionInput {
    return _.isPlainObject(actionExpr) && _.has(actionExpr, 'tag');
  }

  /**
   * Retrieves an action input object from the given action expression or
   * defaultSpec depending on the value of expr
   */
  private static GetActionInput(
    actionExpr: ActionInput | string, defaultSpec: Object | undefined)
    : ActionInput | null {
    let actionInput: ActionInput;
    if (this.IsActionInput(actionExpr)) {
      actionInput = actionExpr;
    } else {
      if (_.has(defaultSpec, `no-default-${actionExpr}`)) {
        return null;
      }
      const defaultActionInput = this.ParseActionExpr(
        _.get(defaultSpec, `default-${actionExpr}`));
      if (!this.IsActionInput(defaultActionInput)) {
        throw new Error(
          `No default hint given for value ${actionExpr}` +
        `To give a default hint, set default-${actionExpr}="{ tag: ... }"`);
      } else {
        actionInput = defaultActionInput;
      }
    }

    return actionInput;
  }

  /**
   *  Determine the included action tag from a `dv-include` action tag.
   *
   *  The `action` input of `dv-include` expects an `ActionInput` value. The
   *  action author could have specified the action input value in two ways:
   *    - by using an object literal in the HTML (<dv-include [action]="{...}">)
   *    - by using a variable and a "default" hint (<dv-include [action]="foo"
   *      default-foo="{...}"). Using a "variable + default hint" allows the
   *      action author to use an input as the action value, but specify a
   *      default one to be used if no action input is given. The default hint
   *      is given with the `default-variableName` attribute. The value of this
   *      attribute should be an `ActionInput` object. Also, if there's no
   *      default action, the author can use the `no-default-variableName`
   *      attribute.
   *
   *      (We need a hint because we only parse the HTML files so it's
   *      impossible for us to tell what the default action input is when that
   *      information is specified in the TypeScript file.)
   *
   *  @param includeActionTag - the action tag to get the included action from
   *  @returns the included action tag or `null` if there is no included tag.
   *    It is `null` if there is no default action and the user hasn't
   *    provided one as input
   */
  private static GetIncludedActionTag(includeActionTag: ActionTag)
    : ActionTag | null {
    const noActionErrorMsg = (cause: string) => `
      Couldn't find the included action in ${JSON.stringify(includeActionTag)}:
      ${cause} \n Context is ${JSON.stringify(includeActionTag.context)}
    `;

    const unparsedActionExpr: string | undefined = _
      .get(includeActionTag.inputs, '[action]');
    if (_.isEmpty(unparsedActionExpr)) {
      throw new Error(noActionErrorMsg('no action input'));
    }

    let actionInput: ActionInput | null;
    try {
      const actionExpr = this.ParseActionExpr(unparsedActionExpr as string);
      if (this.IsActionInput(actionExpr)) {
        actionInput = actionExpr;
      } else {
        // need to figure out if we have one from the context
        if (_.has(includeActionTag.context, `[${actionExpr}]`)) {
          const unparsedParentActionExpr = _
            .get(includeActionTag.context, `[${actionExpr}]`);
          const parentActionExpr = this.ParseActionExpr(
            unparsedParentActionExpr as string);
          actionInput = this.GetActionInput(
            parentActionExpr, includeActionTag.context);
        } else {
          actionInput = this.GetActionInput(
            actionExpr, _.get(includeActionTag, 'inputs'));
        }
      }
    } catch (e) {
      e.message = noActionErrorMsg(e.message);
      throw e;
    }

    if (actionInput === null) {
      return null;
    }

    const fqtag = ActionHelper.GetFqTag(
      actionInput.tag, actionInput.dvOf, actionInput.dvAlias);
    const actionInputs: InputMap = <InputMap> _.get(actionInput, 'inputs', {});
    const inputs = _.assign({},
      // `actionInput.inputMap` could actually be `undefined` but the `invert`
      // typings are wrong (`_.invert(undefined)` -> `undefined`)
      _.mapValues(_.invert(<InputMap> actionInput.inputMap), (value) => {
        return _.get(includeActionTag.context, value);
      }),
      actionInputs);

    return {
      fqtag: fqtag,
      tag: actionInput.tag,
      dvOf: actionInput.dvOf,
      dvAlias: actionInput.dvAlias,
      inputs: inputs,
      context: {}
    };
  }

  /**
   * @return the action table of the given cliche
   */
  private static GetActionTableOfCliche(cliche: string): ActionTable {
    const fp = path.join(
      ActionHelper.GetClicheFolder(cliche), ACTION_TABLE_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8'));
  }

  /**
   * @return the set of actions from the given cliche that are not expected to
   * issue a request
   */
  private static GetActionsNoRequest(cliche: string)
    : { exec: string[] } | undefined {
      const fp = path.join(
        ActionHelper.GetClicheFolder(cliche), CONFIG_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8')).actionsNoRequest;
  }

  private static GetClicheFolder(cliche: string): string {
    // Cliches specify as a main their typings (so that when apps do `import
    // 'cliche'` it works) . To get to their folder we need to go up a dir
    return path.join(path.dirname(require.resolve(cliche)), '..');
  }

  /**
   * @returns the cliche of the action represented by the given tag
   */
  private static ClicheOfTag(tag: string) {
    return tag.split('-')[0];
  }

  private static GetDvOfForChild(
    actionTag: ActionTag, childActionTag: ActionTag): string | undefined {
    if (
      !_.isEmpty(actionTag.dvOf) && _.isEmpty(childActionTag.dvOf) &&
      ActionHelper.ClicheOfTag(actionTag.tag) ===
      ActionHelper.ClicheOfTag(childActionTag.tag)) {
      return actionTag.dvOf;
    }

    return childActionTag.dvOf;
  }

  /**
   * @returns true if the given action is the built-in include action
   */
  private static IsDvIncludeAction(action: ActionTag) {
    return action.tag === 'dv-include';
  }

  /**
   * @returns true if the given action is a tx action
   */
  private static IsDvTxAction(action: ActionTag) {
    return action.tag === 'dv-tx';
  }

  private static ActionExistsOrFail(
    action: ActionTag, actionTable: ActionTable) {
    if (action.tag === 'router-outlet') {
      return;
    }
    if (action.tag.split('-').length === 1) { // it's an html tag
     return;
    }
    if (!_.has(actionTable, action.tag)) {
      const errMsg = `Action ${action.tag} doesn't exist in action table ` +
        `with keys ${JSON.stringify(
          _.keys(actionTable), null, INDENT_NUM_SPACES)}`;
      throw new Error(errMsg);
    }
  }

  /**
   * Create a new action helper
   *
   * @param usedCliches a list of the names of all cliches used (not their
   *                    aliases)
   * @param appActionTable the action table for this app
   * @param routes the route information
   */
  constructor(
    usedCliches?: string[],
    appActionTable?: ActionTable,
    private readonly routes?: { path: string, action: string }[]
  ) {
    const clicheActionTables = _.map(_
      .uniq(usedCliches), ActionHelper.GetActionTableOfCliche);
    const dvCoreActionTable = ActionHelper
      .GetActionTableOfCliche(DV_CORE_CLICHE);
    this.actionTable = _.assign(
      {},
      appActionTable || {},
      ...clicheActionTables,
      dvCoreActionTable
    );

    this.actionsNoExecRequest = new Set<string>(
      _.flatMap(usedCliches, (cliche: string) => _.get(
        ActionHelper.GetActionsNoRequest(cliche), 'exec', [])));

    if (!appActionTable) {
      this.noApp = true;

      return;
    }

    // Prune the action table to have only used actions
    // TODO: instead of adding all app actions, use the route information
    const usedActions = new Set<string>(_.keys(appActionTable));
    const saveUsedActions = (
      actionAst: ActionAst | undefined,
      debugPath: string[]
    ): void => {
      _.each(actionAst, (action: ActionTag) => {
        const thisDebugPath = debugPath.slice();
        thisDebugPath.push(action.fqtag);
        usedActions.add(action.tag);

        try {
          const actionContent = this.getContent(action);
          saveUsedActions(actionContent, thisDebugPath);
        } catch (e) {
          if (!_.has(e, 'actionPath')) {
            e.actionPath = thisDebugPath;
          }
          throw e;
        }
      });
    };

    try {
      _.each(_.keys(appActionTable), (tag: string) => {
        const content = this.getContent({ fqtag: tag, tag: tag });
        saveUsedActions(content, [ tag ]);
      });
    } catch (e) {
      e.message = `Error at path: ${e.actionPath}\n${e.message}`;
      throw e;
    }

    this.actionTable = _.pick(this.actionTable, Array.from(usedActions));
  }

  /**
   * Add a cliche's actions for shouldHaveExecRequest
   * actionTable is not modified because this assumes you did not provide
   *   an appActionTable in which case it is irrelevant
   * Adding the same cliche a second time does nothing
   */
  addCliche(cliche: string) {
    _.get(ActionHelper.GetActionsNoRequest(cliche), 'exec', <string[]>[])
      .forEach((actionName) => this.actionsNoExecRequest.add(actionName));
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
  /*
  getActionOrFail(actionPath: string[]): ActionTag {
    const ret = this.getMatchingActions(actionPath);
    if (_.isEmpty(ret)) {
      throw new Error(`No action ${actionPath} found`);
    }
    if (ret.length > 1) {
      throw new Error(`Found more than one matching action for ${actionPath}`);
    }

    return ret[0];
  }*/

  /**
   * @returns true if the given action path is expected
   */
  actionPathIsValid(actionPath: ActionPath): boolean {
    return !_.isEmpty(this.getMatchingActions(actionPath));
  }

  /**
   * @returns the `ActionTag`s corresponding to the last node of the action path
   */
  getMatchingActions(actionPath: ActionPath): ActionTag[] {
    return <ActionTag[]> _.map(this.getMatchingPaths(actionPath), _.last);
  }

  /**
   * @returns the `ActionTag`s corresponding to the given action path
   */
  getMatchingPaths(actionPath: ActionPath): ActionTagPath[] {
    // We assume here that the first tag in the action path is a simple tag
    // so that fqtag = tag (i.e., the root action is not aliased and it is not
    // from some cliche for which there's more than one instance of in the app)
    if (this.noApp) {
      return [_.map(actionPath.nodes(), (fqtag: string) => ({
        fqtag,
        tag: fqtag
      }))];
    }

    const firstTag = actionPath.first();
    if (!(firstTag in this.actionTable)) {
      return [];
    }
    const matchingNode: ActionTag = {
      fqtag: firstTag, tag: firstTag,
      content: this.getContent({ fqtag: firstTag, tag: firstTag })
    };
    if (actionPath.length() === 1 && firstTag in this.actionTable) {
      return [[ matchingNode ]] ;
    }

    return this._getMatchingPaths(actionPath.tail(), matchingNode.content)
      .map((matchingPath) => [ matchingNode, ...matchingPath ]);
  }

  private _getMatchingPaths(
    actionPath: ActionPath,
    actionAst: ActionAst | undefined
  ): ActionTagPath[] {
    // actionPath.length is always >= 1

    if (_.isEmpty(actionAst)) {
      return [];
    }

    const matchingNodes: ActionTag[] = actionAst
      .filter((at) => at.fqtag === actionPath.first())
      .map((matchingNode) => _.assign(matchingNode, {
        content: this.getContent(matchingNode)
      }));

    if (actionPath.length() === 1) {
      return _.map(
        matchingNodes,
        (matchingNode: ActionTag): ActionTagPath => [ matchingNode ]);
    }

    return _.flatMap(
      matchingNodes,
      (matchingNode: ActionTag): ActionTagPath[] =>  _.map(
        this._getMatchingPaths(actionPath.tail(), matchingNode.content),
        (matchingPath: ActionTagPath) => [ matchingNode, ...matchingPath ]));
  }

  /**
   *  @param actionTag - the action tag to get the content from
   *  @returns the content for the given action tag
   */
  private getContent(actionTag: ActionTag)
    : ActionAst | undefined {
    let ret: ActionAst | undefined;
    if (ActionHelper.IsDvIncludeAction(actionTag)) {
      const includedActionTag: ActionTag | null = ActionHelper
        .GetIncludedActionTag(actionTag);

      if (includedActionTag === null) {
        ret = [];
      } else {
        // TODO: what will happen if we don't have this check?
        ActionHelper.ActionExistsOrFail(includedActionTag, this.actionTable);
        const childDvOf = ActionHelper
          .GetDvOfForChild(actionTag, includedActionTag);

        const childActionTag = {
          ...includedActionTag,
          context: {},
          ...{ dvOf: childDvOf }
        };
        ret = [ childActionTag ];
      }
    } else if (ActionHelper.IsDvTxAction(actionTag)) {
      ret = actionTag.content;
    } else {
      /**
       * By default, the context of the children of this action will be this
       * action's inputs. But if we are passing along an action and there's a
       * value for that in the context, we need to detect that and replace the
       * value with the action input. (If otherwise, we'd loose the information)
       */
      const childContext: InputMap | undefined = actionTag.inputs;
      _.each(actionTag.inputs, (inputValue: string, inputName: string) => {
        /**
         * If one of the inputs has a variable as a value and we have that
         * value defined in the context and the value happens to be an action
         * then replace the value of that input with the action literal.
         */
        if (_.has(actionTag.context, inputValue)) {
          try {
            const actionExpr = ActionHelper.ParseActionExpr(
              actionTag.context![inputValue]);
            childContext![inputName] = JSON.stringify(
              ActionHelper.GetActionInput(actionExpr, actionTag.context));
          } catch (e) {
            // Do nothing. If the attempt to parse and obtain an action input
            // failed it means that it was not an action expr.
          }
        }
      });
      ActionHelper.ActionExistsOrFail(actionTag, this.actionTable);
      ret = _.map(this.actionTable[actionTag.tag], (at: ActionTag) => {
        const childActionTag = { ...at, context: childContext };
        childActionTag.dvOf = ActionHelper.GetDvOfForChild(
          actionTag, childActionTag);

        return childActionTag;
      });
    }
    // https://angular.io/guide/router
    // The router adds the <router-outlet> element to the DOM and subsequently
    // inserts the navigated view element immediately after the <router-outlet>:
    // ```
    // <router-outlet></router-outlet>
    // <!-- Routed components go here -->
    // ```
    const contentTags: string[] = _.map(ret, 'tag');
    if (_.includes(contentTags, 'router-outlet')) {
      const routeActions: ActionTag[] = this.getRouteActions(this.actionTable);
      ret = <ActionTag[]> _.concat(<ActionTag[]> ret, routeActions);
    }

    return ret;
  }

  toString() {
    return JSON.stringify(this.actionTable, null, INDENT_NUM_SPACES);
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
