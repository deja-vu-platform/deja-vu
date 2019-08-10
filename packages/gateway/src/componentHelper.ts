import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import 'lodash.product';

import * as RJSON from 'relaxed-json';
import { ComponentPath } from './componentPath';

export type ComponentAst = ReadonlyArray<ComponentTag>;
export interface InputMap {
  [name: string]: string; /* expr */
}

export interface ComponentTag {
  readonly fqtag: string;
  readonly dvOf?: string;
  readonly dvAlias?: string;
  readonly tag: string;
  // Inputs include not only the angular inputs but also any HTML attributes
  // on the tag
  readonly inputs?: InputMap;
  readonly context?: InputMap;
  readonly content?: ComponentAst;
}

export type ComponentTagPath = ComponentTag[];

/**
 * The component table is indexed by tag. If in the content of two components we have
 * a component of the same tag (but different `of`, or different `alias`) there
 * would still be only one entry for that component in the table.
 */
export interface ComponentTable {
  // note: this is the real component tag, not the fqtag
  readonly [tag: string]: ComponentAst;
}

// From @deja-vu/core
export interface FieldMap {
  [field: string]: string;
}
export interface ComponentInput {
  tag: string;
  // Optional value to specify the cliche the component is from
  dvOf?: string;
  dvAlias?: string;
  // A map of (adapter input name) -> (component input name)
  inputMap?: FieldMap;
  // A map of input names to exprs
  inputs?: FieldMap;
}

const COMPONENT_TABLE_FILE_NAME = 'componentTable.json';
const CONFIG_FILE_NAME = 'dvconfig.json';
const DV_CORE_CLICHE = 'core';
const INDENT_NUM_SPACES = 2;


export class ComponentHelper {
  private readonly componentTable: ComponentTable;
  private readonly componentsNoExecRequest: Set<string>;
  private readonly componentsRequestOptional: Set<string>;
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
    let [clicheName, ...componentTagName] = tag.split('-');
    if (dvOf) { clicheName = dvOf; }

    return clicheName + '-' + componentTagName.join('-');
  }

  /**
   * Attempts to parse an component expression
   */
  private static ParseComponentExpr(expr: string): ComponentInput | string {
    const errMsg = (invalidExpr) =>
      `Expected component object or a variable but found ${invalidExpr}.` +
      `(For an object to be an component object it must have a 'tag' field)`;
    // `componentExpr` could technically be any JavaScript expression, but anything
    // other than a component input object or a variable name will be an error
    let componentExpr: any;
    try {
      componentExpr = RJSON.parse(expr);
    } catch (e) {
      throw new Error(errMsg(expr));
    }

    // We should be checking if the resulting string is actually a valid JS
    // identifier but for now checking for a string with no space should be ok.
    // This is only for returning an understandable error to the user, if it's
    // not a JS variable it will blow up somewhere else (with a cryptic error
    // message)
    const isVariable = _.isString(componentExpr) && !_.has(componentExpr, ' ');
    if (!this.IsComponentInput(componentExpr) && !isVariable) {
      throw new Error(errMsg(expr));
    }

    return componentExpr;
  }

  private static IsComponentInput(componentExpr: ComponentInput | string)
    : componentExpr is ComponentInput {
    return _.isPlainObject(componentExpr) && _.has(componentExpr, 'tag');
  }

  /**
   * Retrieves an component input object from the given component expression or
   * defaultSpec depending on the value of expr
   */
  private static GetComponentInput(
    componentExpr: ComponentInput | string, defaultSpec: Object | undefined)
    : ComponentInput | null {
    let componentInput: ComponentInput;
    if (this.IsComponentInput(componentExpr)) {
      componentInput = componentExpr;
    } else {
      if (_.has(defaultSpec, `no-default-${componentExpr}`)) {
        return null;
      }
      const defaultComponentInput = this.ParseComponentExpr(
        _.get(defaultSpec, `default-${componentExpr}`));
      if (!this.IsComponentInput(defaultComponentInput)) {
        throw new Error(
          `No default hint given for value ${componentExpr}` +
        `To give a default hint, set default-${componentExpr}="{ tag: ... }"`);
      } else {
        componentInput = defaultComponentInput;
      }
    }

    return componentInput;
  }

  /**
   *  Determine the included component tag from a `dv-include` component tag.
   *
   *  The `component` input of `dv-include` expects an `ComponentInput` value. The
   *  component author could have specified the component input value in two ways:
   *    - by using an object literal in the HTML (<dv-include [component]="{...}">)
   *    - by using a variable and a "default" hint (<dv-include [component]="foo"
   *      default-foo="{...}"). Using a "variable + default hint" allows the
   *      component author to use an input as the component value, but specify a
   *      default one to be used if no component input is given. The default hint
   *      is given with the `default-variableName` attribute. The value of this
   *      attribute should be a `ComponentInput` object. Also, if there's no
   *      default component, the author can use the `no-default-variableName`
   *      attribute.
   *
   *      (We need a hint because we only parse the HTML files so it's
   *      impossible for us to tell what the default component input is when that
   *      information is specified in the TypeScript file.)
   *
   *  @param includeComponentTag - the component tag to get the included component from
   *  @returns the included component tag or `null` if there is no included tag.
   *    It is `null` if there is no default component and the user hasn't
   *    provided one as input
   */
  private static GetIncludedComponentTag(includeComponentTag: ComponentTag)
    : ComponentTag | null {
    const noComponentErrorMsg = (cause: string) => `
      Couldn't find the included component in ${JSON.stringify(includeComponentTag)}:
      ${cause} \n Context is ${JSON.stringify(includeComponentTag.context)}
    `;

    const unparsedComponentExpr: string | undefined = _
      .get(includeComponentTag.inputs, '[component]');
    if (_.isEmpty(unparsedComponentExpr)) {
      throw new Error(noComponentErrorMsg('no component input'));
    }

    let componentInput: ComponentInput | null;
    try {
      const componentExpr = this.ParseComponentExpr(unparsedComponentExpr as string);
      if (this.IsComponentInput(componentExpr)) {
        componentInput = componentExpr;
      } else {
        // need to figure out if we have one from the context
        if (_.has(includeComponentTag.context, `[${componentExpr}]`)) {
          const unparsedParentComponentExpr = _
            .get(includeComponentTag.context, `[${componentExpr}]`);
          const parentComponentExpr = this.ParseComponentExpr(
            unparsedParentComponentExpr as string);
          componentInput = this.GetComponentInput(
            parentComponentExpr, includeComponentTag.context);
        } else {
          componentInput = this.GetComponentInput(
            componentExpr, _.get(includeComponentTag, 'inputs'));
        }
      }
    } catch (e) {
      e.message = noComponentErrorMsg(e.message);
      throw e;
    }

    if (componentInput === null) {
      return null;
    }

    const fqtag = ComponentHelper.GetFqTag(
      componentInput.tag, componentInput.dvOf, componentInput.dvAlias);
    const componentInputs: InputMap = <InputMap> _.get(componentInput, 'inputs', {});
    const inputs = _.assign({},
      // `componentInput.inputMap` could actually be `undefined` but the `invert`
      // typings are wrong (`_.invert(undefined)` -> `undefined`)
      _.mapValues(_.invert(<InputMap> componentInput.inputMap), (value) => {
        return _.get(includeComponentTag.context, value);
      }),
      componentInputs);

    return {
      fqtag: fqtag,
      tag: componentInput.tag,
      dvOf: componentInput.dvOf,
      dvAlias: componentInput.dvAlias,
      inputs: inputs,
      context: {}
    };
  }

  /**
   * @return the component table of the given cliche
   */
  private static GetComponentTableOfCliche(cliche: string): ComponentTable {
    const fp = path.join(
      ComponentHelper.GetClicheFolder(cliche), COMPONENT_TABLE_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8'));
  }

  /**
   * @return the set of components from the given cliche that are not expected to
   * issue a request
   */
  private static GetComponentsNoRequest(cliche: string)
    : { exec: string[] } | undefined {
      const fp = path.join(
        ComponentHelper.GetClicheFolder(cliche), CONFIG_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8')).componentsNoRequest;
  }

  /**
   * @return the set of components from the given cliche that only optionally issue
   * requests
   */
  private static GetComponentsRequestOptional(cliche: string)
    : string[] | undefined {
      const fp = path.join(
        ComponentHelper.GetClicheFolder(cliche), CONFIG_FILE_NAME);

    return JSON.parse(readFileSync(fp, 'utf8')).componentsRequestOptional;
  }

  private static GetClicheFolder(cliche: string): string {
    // Cliches specify as a main their typings (so that when apps do `import
    // 'cliche'` it works) . To get to their folder we need to go up a dir
    return path.join(path.dirname(
      require.resolve(`@deja-vu/${cliche}`)), '..');
  }

  /**
   * @returns the cliche of the component represented by the given tag
   */
  private static ClicheOfTag(tag: string) {
    return tag.split('-')[0];
  }

  private static GetDvOfForChild(
    componentTag: ComponentTag, childComponentTag: ComponentTag): string | undefined {
    if (
      !_.isEmpty(componentTag.dvOf) && _.isEmpty(childComponentTag.dvOf) &&
      ComponentHelper.ClicheOfTag(componentTag.tag) ===
      ComponentHelper.ClicheOfTag(childComponentTag.tag)) {
      return componentTag.dvOf;
    }

    return childComponentTag.dvOf;
  }

  /**
   * @returns true if the given component is the built-in include component
   */
  private static IsDvIncludeComponent(component: ComponentTag) {
    return component.tag === 'dv-include';
  }

  /**
   * @returns true if the given component is a tx component
   */
  private static IsDvTxComponent(component: ComponentTag) {
    return component.tag === 'dv-tx';
  }

  private static ComponentExistsOrFail(
    component: ComponentTag, componentTable: ComponentTable) {
    if (component.tag === 'router-outlet') {
      return;
    }
    if (component.tag.split('-').length === 1) { // it's an html tag
     return;
    }
    if (!_.has(componentTable, component.tag)) {
      const errMsg = `Component ${component.tag} doesn't exist in component table ` +
        `with keys ${JSON.stringify(
          _.keys(componentTable), null, INDENT_NUM_SPACES)}`;
      throw new Error(errMsg);
    }
  }

  static PickComponentTagPath(
    componentPath: ComponentTagPath | ComponentTag[] | ComponentAst,
    pickProps: string[]): any[] {
    return _.map(componentPath, (componentTag) => {
      const newContent = ComponentHelper
        .PickComponentTagPath(componentTag.content, pickProps);
      const rest = _.pick(componentTag, pickProps);

      return _.isEmpty(newContent) ? rest : { ...rest, content: newContent };
    });
  }

  /**
   * Create a new component helper
   *
   * @param usedCliches a list of the names of all cliches used (not their
   *                    aliases)
   * @param appComponentTable the component table for this app
   * @param routeComponentSelectors tags of components that have a route
   *   tag should be of form appname-component-name
   */
  constructor(
    usedCliches?: string[],
    appComponentTable?: ComponentTable,
    private readonly routeComponentSelectors?: string[]
  ) {
    const clicheComponentTables = _.map(_
      .uniq(usedCliches), ComponentHelper.GetComponentTableOfCliche);
    const dvCoreComponentTable = ComponentHelper
      .GetComponentTableOfCliche(DV_CORE_CLICHE);
    this.componentTable = _.assign(
      {},
      appComponentTable || {},
      ...clicheComponentTables,
      dvCoreComponentTable
    );

    this.componentsNoExecRequest = new Set<string>(
      _.flatMap(usedCliches, (cliche: string) => _.get(
        ComponentHelper.GetComponentsNoRequest(cliche), 'exec', [])));
    this.componentsRequestOptional = new Set<string>(
      _.flatMap(usedCliches, (cliche: string): string[] =>
        ComponentHelper.GetComponentsRequestOptional(cliche) || []));

    if (!appComponentTable) {
      this.noApp = true;

      return;
    }

    // Prune the component table to have only used components
    // TODO: instead of adding all app components, use the route information
    const usedComponents = new Set<string>(_.keys(appComponentTable));
    // The iteration order of Set is the insertion order
    const saveUsedComponents = (
      componentAst: ComponentAst | undefined,
      debugPath: Set<string>
    ): void => {
      _.each(componentAst, (component: ComponentTag) => {
        const thisDebugPath = new Set(debugPath);
        // If this debugPath has component.fqtag already, we have a loop and we
        // need to stop (because we already added all the used components)
        if (thisDebugPath.has(component.fqtag)) {
          return;
        }
        thisDebugPath.add(component.fqtag);
        usedComponents.add(component.tag);

        try {
          const componentContent = this.getContent(component);
          saveUsedComponents(componentContent, thisDebugPath);
        } catch (e) {
          if (!_.has(e, 'componentPath')) {
            e.componentPath = [ ...thisDebugPath ];
          }
          throw e;
        }
      });
    };

    try {
      _.each(_.keys(appComponentTable), (tag: string) => {
        const content = this.getContent({ fqtag: tag, tag: tag });
        saveUsedComponents(content, new Set([ tag ]));
      });
    } catch (e) {
      e.message = `Error at path: ${e.componentPath}\n${e.message}`;
      throw e;
    }

    this.componentTable = _.pick(this.componentTable, Array.from(usedComponents));
  }

  /**
   * @returns true if the component given by `tag` is expected to do an exec
   * request
   */
  shouldHaveExecRequest(tag: string): boolean {
    return !this.componentsNoExecRequest.has(tag);
  }

  isRequestOptional(tag: string): boolean {
    return this.componentsRequestOptional.has(tag);
  }

  /**
   * @returns the `ComponentTag` corresponding to the given component path
   */
  /*
  getComponentOrFail(componentPath: string[]): ComponentTag {
    const ret = this.getMatchingComponents(componentPath);
    if (_.isEmpty(ret)) {
      throw new Error(`No component ${componentPath} found`);
    }
    if (ret.length > 1) {
      throw new Error(`Found more than one matching component for ${componentPath}`);
    }

    return ret[0];
  }*/

  /**
   * @returns true if the given component path is expected
   */
  componentPathIsValid(componentPath: ComponentPath): boolean {
    return !_.isEmpty(this.getMatchingComponents(componentPath));
  }

  /**
   * @returns the `ComponentTag`s corresponding to the last node of the component path
   */
  getMatchingComponents(componentPath: ComponentPath): ComponentTag[] {
    return <ComponentTag[]> _.map(this.getMatchingPaths(componentPath), _.last);
  }

  /**
   * @returns the `ComponentTag`s corresponding to the given component path
   */
  getMatchingPaths(componentPath: ComponentPath): ComponentTagPath[] {
    // We assume here that the first tag in the component path is a simple tag
    // so that fqtag = tag (i.e., the root component is not aliased and it is not
    // from some cliche for which there's more than one instance of in the app)
    if (this.noApp) {
      return [_.map(componentPath.nodes(), (fqtag: string) => ({
        fqtag,
        tag: fqtag
      }))];
    }

    const firstTag = componentPath.first();
    if (!(firstTag in this.componentTable)) {
      return [];
    }
    const matchingNode: ComponentTag = {
      fqtag: firstTag, tag: firstTag,
      content: this.getContent({ fqtag: firstTag, tag: firstTag })
    };
    if (componentPath.length() === 1 && firstTag in this.componentTable) {
      return [[ matchingNode ]] ;
    }

    return this._getMatchingPaths(componentPath.tail(), matchingNode.content)
      .map((matchingPath) => [ matchingNode, ...matchingPath ]);
  }

  private _getMatchingPaths(
    componentPath: ComponentPath,
    componentAst: ComponentAst | undefined
  ): ComponentTagPath[] {
    // componentPath.length is always >= 1

    if (_.isEmpty(componentAst)) {
      return [];
    }

    const matchingNodes: ComponentTag[] = componentAst
      .filter((at) => at.fqtag === componentPath.first())
      .map((matchingNode) => _.assign(matchingNode, {
        content: this.getContent(matchingNode)
      }));

    if (componentPath.length() === 1) {
      return _.map(
        matchingNodes,
        (matchingNode: ComponentTag): ComponentTagPath => [ matchingNode ]);
    }

    return _.flatMap(
      matchingNodes,
      (matchingNode: ComponentTag): ComponentTagPath[] =>  _.map(
        this._getMatchingPaths(componentPath.tail(), matchingNode.content),
        (matchingPath: ComponentTagPath) => [ matchingNode, ...matchingPath ]));
  }

  /**
   *  @param componentTag - the component tag to get the content from
   *  @returns the content for the given component tag
   */
  private getContent(componentTag: ComponentTag)
    : ComponentAst | undefined {
    let ret: ComponentAst | undefined;
    if (ComponentHelper.IsDvIncludeComponent(componentTag)) {
      const includedComponentTag: ComponentTag | null = ComponentHelper
        .GetIncludedComponentTag(componentTag);

      if (includedComponentTag === null) {
        ret = [];
      } else {
        // TODO: what will happen if we don't have this check?
        ComponentHelper.ComponentExistsOrFail(includedComponentTag, this.componentTable);
        const childDvOf = ComponentHelper
          .GetDvOfForChild(componentTag, includedComponentTag);

        const childComponentTag = {
          ...includedComponentTag,
          context: {},
          ...{ dvOf: childDvOf }
        };
        ret = [ childComponentTag ];
      }
    } else if (ComponentHelper.IsDvTxComponent(componentTag)) {
      ret = componentTag.content;
    } else {
      /**
       * By default, the context of the children of this component will be this
       * component's inputs. But if we are passing along a component and there's a
       * value for that in the context, we need to detect that and replace the
       * value with the component input. (If otherwise, we'd loose the information)
       */
      const childContext: InputMap | undefined = componentTag.inputs;
      _.each(componentTag.inputs, (inputValue: string, inputName: string) => {
        /**
         * If one of the inputs has a variable as a value and we have that
         * value defined in the context and the value happens to be an component
         * then replace the value of that input with the component literal.
         */
        if (_.has(componentTag.context, inputValue)) {
          try {
            const componentExpr = ComponentHelper.ParseComponentExpr(
              componentTag.context![inputValue]);
            childContext![inputName] = JSON.stringify(
              ComponentHelper.GetComponentInput(componentExpr, componentTag.context));
          } catch (e) {
            // Do nothing. If the attempt to parse and obtain an component input
            // failed it means that it was not an component expr.
          }
        }
      });
      ComponentHelper.ComponentExistsOrFail(componentTag, this.componentTable);
      ret = _.map(this.componentTable[componentTag.tag], (at: ComponentTag) => {
        const childComponentTag = { ...at, context: childContext };
        childComponentTag.dvOf = ComponentHelper.GetDvOfForChild(
          componentTag, childComponentTag);

        return childComponentTag;
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
      // user could have multiple routes to the same component so we need to dedup
      const routeComponents: ComponentTag[] = _.uniqBy(
        this.getRouteComponents(this.componentTable), 'fqtag');
      ret = <ComponentTag[]> _.concat(<ComponentTag[]> ret, routeComponents);
    }

    return ret;
  }

  toString() {
    return JSON.stringify(this.componentTable, null, INDENT_NUM_SPACES);
  }

  /**
   * @return a list of `ComponentTag`s, one for each route
   */
  private getRouteComponents(componentTable: ComponentTable): ComponentTag[] {
    return _.map(this.routeComponentSelectors, (component: string) => {
      if (!_.has(componentTable, component)) {
        throw new Error(`Route component ${component} doesn't exist`);
      }

      return {
        fqtag: component,
        tag: component,
        content: componentTable[component],
        context: {}
      };
    });
  }
}
