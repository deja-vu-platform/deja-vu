import {readFileSync} from 'fs';
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
  // Inputs include not only the angular inputs but also any HTML attributes
  // on the tag
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

    const unparsedActionExpr: string = _
      .get(includeActionTag.inputs, '[action]');
    if (_.isEmpty(unparsedActionExpr)) {
      throw new Error(noActionErrorMsg('no action input'));
    }

    let actionInput: ActionInput | null;
    try {
      const actionExpr = this.ParseActionExpr(unparsedActionExpr);
      if (this.IsActionInput(actionExpr)) {
        actionInput = actionExpr;
      } else {
        // need to figure out if we have one from the context
        if (_.has(includeActionTag.context, `[${actionExpr}]`)) {
          console.log(`INCLUDE: We HAVE one from the context for ${JSON.stringify(includeActionTag)}`);
          const unparsedParentActionExpr = _
            .get(includeActionTag.context, `[${actionExpr}]`);
          const parentActionExpr = this.ParseActionExpr(
            unparsedParentActionExpr);
          console.log(`Using parent Expr ${unparsedParentActionExpr}`);
          console.log(`And context ${JSON.stringify(includeActionTag.context)}`);
          actionInput = this.GetActionInput(
            parentActionExpr, includeActionTag.context);
          console.log(`Got back ${JSON.stringify(actionInput)}`);
        } else {
          console.log(`INCLUDE: We don't have one from the context for ${JSON.stringify(includeActionTag)}`);
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
    const actionInputs: InputMap = _.get(actionInput, 'inputs', {});
    const inputs = _.assign({},
      _.mapValues(_.invert(actionInput.inputMap), (value) => {
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
        `with keys ${JSON.stringify(_.keys(actionTable), null, 2)}`;
      throw new Error(errMsg);
    }
  }

  /**
   * Create a new action helper
   *
   * @param appActionTable the action table for this app
   * @param usedCliches a list of the names of all cliches used (not their
   *                    aliases)
   * @param routes the route information
   */
  constructor(
    appActionTable: ActionTable, usedCliches: string[],
    private readonly routes: { path: string, action: string }[] | undefined) {
    const clicheActionTables: ActionTable[] = _.map(
        _.uniq(usedCliches), ActionHelper.GetActionTableOfCliche);
    const allActionsTable = _.assign({}, appActionTable, ...clicheActionTables);
    console.log(
      `Unpruned action table ${JSON.stringify(allActionsTable, null, 2)}`);
    console.log('Done printing');

    // Prune the action table to have only used actions
    // TODO: instead of adding all app actions, use the route information
    const usedActions = new Set<string>(_.keys(appActionTable));
    const seenActions = new Set<string>();
    const saveUsedActions = (
      actionAst: ActionAst | undefined, debugPath: string[]): void => {
      console.log(`Looking at AST ${JSON.stringify(actionAst)}`);
      _.each(actionAst, (action: ActionTag) => {
        console.log(`Looking at action ${JSON.stringify(action)}`);
        const thisDebugPath = debugPath.slice();
        thisDebugPath.push(action.fqtag);
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
          const actionContent = this.getContent(action, allActionsTable);
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
        const content = this.getContent(
          { fqtag: tag, tag: tag }, allActionsTable);
        saveUsedActions(content, [ tag ]);
      });
    } catch (e) {
      e.message = `Error at path: ${e.actionPath}\n${e.message}`;
      throw e;
    }

    this.actionTable = _.pick(allActionsTable, Array.from(usedActions));
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
    const matchingNode: ActionTag = {
      fqtag: firstTag, tag: firstTag,
      content: this.getContent(
        { fqtag: firstTag, tag: firstTag }, this.actionTable)
    };
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
      (matchingNode: ActionTag) => _
        .assign(matchingNode, {
          content: this.getContent(matchingNode, this.actionTable)
        }));

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
   *  @returns the content for the given action tag
   */
  private getContent(actionTag: ActionTag, actionTable: ActionTable)
    : ActionAst | undefined {
    let ret: ActionAst | undefined;
    if (ActionHelper.IsDvIncludeAction(actionTag)) {
      const includedActionTag: ActionTag | null = ActionHelper
        .GetIncludedActionTag(actionTag);

      if (includedActionTag === null) {
        ret = [];
      } else {
        // TODO: what will happen if we don't have this check?
        ActionHelper.ActionExistsOrFail(includedActionTag, actionTable);
        ret = [ { ...includedActionTag, context: {} } ];
      }
    } else if (ActionHelper.IsDvAction(actionTag)) {
      ret = actionTag.content;
    } else {
      /**
       * By default, the context of the children of this action will be this
       * action's inputs. But if we are passing along an action and there's a
       * value for that in the context, we need to detect that and replace the
       * value with the action input. (If otherwise, we'd loose the information)
       */
      const childContext: InputMap | undefined = actionTag.inputs;
      if (_.isEmpty(actionTag.inputs))  {
        console.log(`inputs of ${JSON.stringify(actionTag)} is empty so nothing to override` );
      } else {
        console.log(`will try with ${JSON.stringify(actionTag)}` );
      }
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
            console.log(
              `OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOVERWROTE ${inputName} with ${childContext![inputName]}`);
          } catch (e) {
            console.log('got an error so no action');
            // Do nothing. If the attempt to parse and obtain an action input
            // failed it means that it was not an action expr.
          }
        } else {
         console.log(`didn't find ${inputValue} in context`) ;
        }
      });
      ActionHelper.ActionExistsOrFail(actionTag, actionTable);
      ret = _.map(actionTable[actionTag.tag], (at: ActionTag) => {
        return { ...at, context: childContext };
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
    console.log(`Checking ${JSON.stringify(contentTags)} for a router outlet`);
    if (_.includes(contentTags, 'router-outlet')) {
      const routeActions: ActionTag[] = this.getRouteActions(actionTable);
      ret = _.concat(ret, routeActions);
      console.log(`Added ${routeActions} `);
    }

    console.log(`Returning content ${JSON.stringify(ret)} for ${JSON.stringify(actionTag)}`);

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
