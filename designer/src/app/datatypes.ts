import { Component } from '@angular/compiler/src/core';
import { EventEmitter } from '@angular/core';
import * as graphlib from 'graphlib';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

import dvdAppStyles from './dvd-app-styles';
import { exportDvExpr } from './expression.compiler';

/**
 * A named collection of actions
 * Could be App, ClicheDefinition, ClicheInstance, etc.
 */
export interface ActionCollection {
  name: string;
  actions: ActionDefinition[];
}

/**
 * an input map for each named action input
 */
export interface ActionInputs {
  // ioName is what you would put $ in front of to reference
  // the value is the name of the property set in the included action
  [forInput: string]: { [ioName: string]: string };
}

/**
 * inputs that are present on **every** action
 * cliche actions should already have these
 * these need to be added to app actions
 */
export const OMNIPRESENT_INPUTS = [
  'hidden'
];

/**
 * Action Definition
 * Defines the name you use, the inputs you provide,
 * and the outputs and content you get when you instantiate an action
 */
export interface ActionDefinition {
  name: string;
  readonly inputs: string[]; // TODO: input type
  readonly outputs: string[];
  readonly actionInputs: ActionInputs;
  ioDescriptions: { [ioName: string]: string };
}


export interface ClicheActionDefinition extends ActionDefinition {
  readonly component: Component;
  description: string;
}

/**
 * Definitions of Inputs or Outputs for AppActionDefinition
 */
// tslint:disable-next-line interface-name
export interface IO {
  name: string;
  value: string; // default constant for input, epression for output
}

export interface InInput {
  name: string;
  of: ActionInstance;
}

export const defaultAppActionStyles = {
  backgroundColor: 'transparent',
  borderWidth: '0',
  borderColor: 'black',
  borderStyle: 'solid',
  padding: '8px'
};
export type AppActionStyles = typeof defaultAppActionStyles;

function exportStr(str: string): string {
  return str.startsWith('=')
    ? exportDvExpr(str.slice(1))
    : JSON.stringify(str);
}

export class AppActionDefinition implements ActionDefinition {
  name: string;
  readonly inputSettings: IO[] = [];
  readonly outputSettings: IO[] = [];
  private _rows: Row[] = [];
  transaction = false;
  // App Actions cannot have action inputs
  readonly actionInputs: Readonly<ActionInputs> = {};
  // TODO: export styles
  readonly styles = _.cloneDeep(defaultAppActionStyles);
  readonly ioDescriptions = {};

  constructor(name: string) {
    this.name = name;
  }

  get inputs(): string[] {
    return [
      ...OMNIPRESENT_INPUTS,
      ...this.inputSettings.map((io) => io.name)
    ].sort();
  }

  get outputs(): string[] {
    return this.outputSettings.map((io) => io.name)
      .sort();
  }

  get rows(): Row[] {
    _.remove(this._rows, (row) => row.actions.length === 0);

    return this._rows;
  }

  getChildren(includeInputs = false): ActionInstance[] {
    return this.rows
      .map((r) => r.actions
        .map((a) => includeInputs
        ? [a, ...a.getInputtedActions(true)]
        : [a]
        )
        .flat()
      )
      .flat();
  }

  /**
   * Determines whether or not this contains an instance of an action
   * @param deep false: A parent of B; true: A ancestor of B
   */
  contains(actionDefinition: ActionDefinition, deep = false) {
    return this.rows.some((r) =>
      r.actions.some((a) => a.isOrContains(actionDefinition, deep))
    );
  }

  /**
   * Find the child action instance with given cliche and action name
   * Returns undefined if none is found
   * TODO: stop assuming each cliche x action combo is unique
   */
  findChild(
    clicheName: string,
    actionName: string
  ): ActionInstance | undefined {
    for (const row of this.rows) {
      const action = row.actions.find((a) =>
        a.from.name === clicheName && a.of.name === actionName
      );
      if (action) { return action; }
    }
  }

  toHTML(): string {
    let html = `<dv.action name="${this.name}"`;
    const outputs = this.outputSettings.filter(({ value }) => !!value);
    outputs.forEach(({ name, value }) => {
      html += `\n  ${name}$=${exportStr(value)}`;
    });
    if (outputs.length > 0) {
      html += '\n';
    }
    html += '>\n';
    if (this.transaction) {
      html += '<dv.tx>\n';
    }
    html += `<div class="dvd-action ${this.name}">\n`;
    _.forEach(this.rows, (row) => {
      html += row.toHTML() + '\n';
    });
    html += '</div>\n';
    if (this.transaction) {
      html += '</dv.tx>\n';
    }
    html += '</dv.action>';

    return html;
  }

  toCSS(): string {
    let css = `.dvd-action.${this.name} {`;
    _.forEach(this.styles, (value, property) => {
      css += `\n  ${_.kebabCase(property)}: ${value};`;
    });
    css += '\n}';

    return css;
  }

  toJSON() {
    return {
      name: this.name,
      inputSettings: this.inputSettings,
      outputSettings: this.outputSettings,
      rows: this.rows.map((row) => row.toJSON()),
      transaction: this.transaction,
      styles: this.styles
      // app actions do not have action inputs
    };
  }

}

/**
 * Angular doesn't like style attributes so we have classes for flex
 * e.g. .dvd-row.jsa gives you justify-content: space-around
 */
const flex = {
  fs: 'flex-start',
  fe: 'flex-end',
  c: 'center'
};

export const flexJustify = {
  ...flex,
  sa: 'space-around',
  sb: 'space-between',
  se: 'space-evenly'
};

export const flexAlign = {
  ...flex,
  b: 'baseline',
  s: 'stretch'
};

/**
 * Actions in AppActionDefinitions are grouped into rows for stylistic reasons
 */
export class Row {
  readonly actions: ActionInstance[] = [];
  hJust: keyof typeof flexJustify = 'fs';
  vAlign: keyof typeof flexAlign = 's';

  constructor() {}

  toHTML(): string {

    let html = `  <div class="dvd-row j${this.hJust} a${this.vAlign}">\n`;
    _.forEach(this.actions, (action) => {
      html += action.toHTML();
    });
    html += `  </div>\n`;

    return html;
  }

  toJSON() {
    return {
      actions: this.actions.map((action) => action.toJSON()),
      hJust: this.hJust,
      vAlign: this.vAlign
    };
  }
}

/**
 * An Action Instance is a single usage (HTML Tag) of an action
 * It has its own input settings and its own outputs
 * But these are defined by its definition
 */
export class ActionInstance {
  readonly id = uuidv4();
  readonly of: ActionDefinition;
  readonly from: ActionCollection;
  // type is ActionInstance iff inputName in of.actionInputs
  readonly inputSettings: { [inputName: string]: string | ActionInstance } = {};
  // TODO: export styles
  data?: any; // currently only used for the text widget
  readonly styles = { stretch: false };
  // used to tell UI when input settings change
  // not data, but putting it elsewhere requires uglier code
  readonly shouldReLink: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    ofAction: ActionDefinition,
    from: ActionCollection
  ) {
    this.of = ofAction;
    this.from = from;
  }

  // needed for action processing
  get fqtag(): string {
    return `${this.from.name}-${this.of.name}`;
  }

  get isAppAction(): boolean {
    return (this.from instanceof App);
  }

  get isText(): boolean {
    return (
      this.from.name === 'dv'
      && this.of.name === 'text'
    );
  }

  isOrContains(actionDefinition: ActionDefinition, deep: boolean): boolean {
    return (
      // is
      this.of === actionDefinition
      // contains (content, app action only)
      || (
        this.of instanceof AppActionDefinition
        && this.of.contains(actionDefinition, deep)
      )
      // contains (action input, cliche action only but no need to check this)
      || _.some(
          _.pickBy(this.inputSettings, (_v, k) => k in this.of.actionInputs),
          (a: ActionInstance) => a && a.isOrContains(actionDefinition, deep)
        )
    );
  }

  /**
   * @param extraIndents should not be provided externally
   */
  toHTML(extraIndents = 0): string {
    // text widget is just plain HTML static content
    if (this.isText) {
      return `    <div>${this.data}</div>\n`;
    }

    const baseNumIndents = 4;
    const xIdnt = '  '.repeat(extraIndents);

    let html = `    <${this.from.name}.${this.of.name}`;

    let numAttrs = 0;
    if (this.styles.stretch) {
      numAttrs += 1;
      html += `\n${xIdnt}      class="stretch"`;
    }
    _.forEach(this.inputSettings, (val, key) => {
      if (key === '*content' || !val) { return; }
      numAttrs += 1;
      const strVal = _.isString(val)
        ? exportStr(val)
        : val.toHTML(extraIndents + 1)
          .slice(baseNumIndents, -1); // strip leading indent and ending newline
      html += `\n${xIdnt}      ${key}=${strVal}`;
    });

    if (numAttrs === 0) {
      html += ' ';
    } else {
      html += `\n${xIdnt}    `;
    }
    if (this.inputSettings['*content']) {
      html += '>\n';
      html += '  '.repeat(extraIndents + 1)
        + (this.inputSettings['*content'] as ActionInstance)
          .toHTML(extraIndents + 1);
      html += `${xIdnt}    </${this.from.name}.${this.of.name}>\n`;
    } else {
      html += '/>\n';
    }

    // TODO: ngContent

    return html;
  }

  toJSON() {
    const json = {
      of: this.of.name,
      from: this.from.name,
      inputSettings: this.inputSettings,
      styles: this.styles
    };
    if (this.data) {
      json['data'] = this.data;
    }

    return json;
  }

  /**
   * @param deep also walk the inputs of any inputted actions
   * @param callback function called at each input
   * (inInput) is a private arg
   */
  walkInputs(deep: boolean,
    callback: (
      name: string,
      value: string | ActionInstance,
      ofAction: ActionInstance,
      inInput?: InInput
    ) => void,
    inInput?: InInput
  ): void {
    this.of.inputs.forEach((name) => {
      const value = this.inputSettings[name];
      if (deep && value instanceof ActionInstance) {
        value.walkInputs(true, callback, { name, of: this });
      }
      callback(name, value, this, inInput);
    });
  }

  getInputtedActions(deep: boolean): ActionInstance[] {
    const inputtedActions: ActionInstance[] = [];
    this.walkInputs(deep, (name, value) => {
      if (value instanceof ActionInstance) {
        inputtedActions.push(value);
      }
    });

    return inputtedActions;
  }
}

// AppActionInstance vs ClicheActionInstance isn't relevant
// For the cases when it does matter, inspecting .of is fine

/**
 * A cliche is defined by its names and the actions it has
 */
export interface ClicheDefinition {
  readonly name: string;
  readonly actions: ClicheActionDefinition[];
  readonly configWizardComponent: any;
  // TODO: config options
}

/**
 * The same cliche can be instantiated ("included") multiple times
 * One reason for this is getting a second db
 * Another is to use different config options
 */
export class ClicheInstance {
  name: string;
  readonly of: ClicheDefinition;
  readonly config: { [s: string]: any } = {};

  constructor(name: string, ofCliche: ClicheDefinition) {
    this.name = name;
    this.of = ofCliche;
  }

  get actions() {
    return this.of.actions;
  }

  toJSON() {
    return {
      name: this.name,
      of: this.of.name,
      config: this.config
    };
  }
}

/**
 * A DV App created with the Designer
 */
export class App {
  // populated in cliche.module.ts to avoid circular dependencies
  static dvCliche: ActionCollection;
  static clicheDefinitions: ClicheDefinition[];

  name: string; // no dashes
  readonly actions: AppActionDefinition[];
  readonly pages: AppActionDefinition[]; // subset of actions
  homepage: AppActionDefinition; // member of pages
  readonly cliches: ClicheInstance[] = [];
  readonly ioDescriptions = {};

  // need consistent object to return
  private readonly _actionCollections: ActionCollection[] = [];

  /**
   * Create an app from a save file
   */
  static fromJSON(jsonString: string): App {
    const appJSON = JSON.parse(jsonString);

    const app = new App(appJSON.name);

    // clear default action
    app.actions.pop();
    app.pages.pop();

    appJSON.cliches.forEach((ci) => {
      const ofCliche = App.clicheDefinitions.find((cd) => cd.name === ci.of);
      const clicheInstance = new ClicheInstance(ci.name, ofCliche);
      Object.assign(clicheInstance.config, ci.config);
      app.cliches.push(clicheInstance);
    });

    appJSON.actions.forEach((aad) => {
      const actionDef = new AppActionDefinition(aad.name);
      actionDef.inputSettings
        .push.apply(actionDef.inputSettings, aad.inputSettings);
      actionDef.outputSettings
        .push.apply(actionDef.outputSettings, aad.outputSettings);
      actionDef.transaction = aad.transaction;
      Object.assign(actionDef.styles, aad.styles);
      aad.rows.forEach((r) => {
        const row = new Row();
        r.actions.forEach((ai) => {
          const actionInst = app.newActionInstanceByName(ai.of, ai.from);
          Object.assign(actionInst.styles, ai.styles);
          app.setInputsFromJSON(actionInst, ai);
          row.actions.push(actionInst);
        });
        row.hJust = r.hJust;
        row.vAlign = r.vAlign;
        actionDef.rows.push(row);
      });
      app.actions.push(actionDef);
    });
    app.actions.sort((aad1, aad2) => aad1.name < aad2.name ? -1 : 1);

    appJSON.pages.forEach((p) => {
      const page = app.actions.find((a) => a.name === p);
      app.pages.push(page);
    });

    app.homepage = app.actions.find((a) => a.name === appJSON.homepage);

    return app;
  }

  constructor(name: string) {
    this.name = name;
    this.actions = [new AppActionDefinition('new-action-1')];
    this.pages = [...this.actions];
    this.homepage = this.pages[0];
    this._actionCollections.push(this);
  }

  private tsortActions(): AppActionDefinition[] {
    const graph = new graphlib.Graph();
    this.actions.forEach((a) => graph.setNode(a.name));
    this.actions.forEach((a1) => {
      this.actions.forEach((a2) => {
        if (a1.contains(a2)) {
          graph.setEdge(a1.name, a2.name);
        }
      });
    });

    return graphlib.alg.topsort(graph)
      .reverse()
      .map((name) => this.actions.find((a) => a.name === name));
  }

  toJSON() {
    return {
      name: this.name,
      actions: this.tsortActions()
        .map((action) => action.toJSON()),
      pages: this.pages.map((p) => p.name),
      homepage: this.homepage.name,
      cliches: this.cliches
    };
  }

  /**
   * Generate package.json for the app
   * TODO: non-default version, author, repo, etc.
   */
  toPackageJSON() {
    return JSON.stringify({
      name: this.name,
      version: '0.0.1',
      scripts: {
        start: 'dv serve'
      },
      private: true,
      devDependencies: {
        '@deja-vu/cli': '0.0.1'
      },
      repository: 'github:spderosso/dejavu',
      license: 'MIT',
      bugs: {
        url: 'https://github.com/spderosso/dejavu/issues'
      },
      homepage: 'https://github.com/spderosso/dejavu#readme'
    }, null, '  ');
  }

  /**
   * Generate dvconfig.json for the app
   */
  toDVConfigJSON() {
    const basePort = 3000;
    const clichePortOffset = 2;

    return JSON.stringify({
      name: this.name,
      type: 'app',
      gateway: {
        config: {
          wsPort: basePort
        }
      },
      usedCliches: _.reduce(this.cliches, (obj, cliche, idx) => (
        (obj[cliche.name] = {
          name: cliche.of.name,
          config: {
            wsPort: basePort + clichePortOffset + idx,
            ...cliche.config
          }
        }) && obj // mutate and then return obj
      ), {}),
      routes: [
        { path: '', action: this.homepage.name },
        ..._.map(this.pages, (page) => (
          { path: page.name, action: page.name }
        ))
      ]
    }, null, '  ');
  }

  toCSS(): string {
    return (
      dvdAppStyles
      + '\n'
      + this.actions.reduce((css, action) => css + '\n\n' + action.toCSS(), '')
    );
  }

  // We need a consistent object to return or Angular freaks out
  get actionCollections(): ActionCollection[] {
    this._actionCollections.splice(0);
    this._actionCollections.push(this);
    this._actionCollections.push(App.dvCliche);
    this._actionCollections.push.apply(
      this._actionCollections,
      this.cliches
        .sort(({ name: nameA }, { name: nameB }) =>
          nameA === nameB ? 0 : (nameA < nameB ? -1 : 1)
        )
    );

    return this._actionCollections;
  }

  /**
   * @param ofName name of action declared in app, imported cliche, or DV cliche
   * @param fromName name of cliche instance, or app, or the DV cliche
   * @return a new action instance or undefined if the names do not resolve
   */
  newActionInstanceByName(ofName: string, fromName: string): ActionInstance {
    const fromSource = this.actionCollections.find((c) => c.name === fromName);

    const ofAction = fromSource
      ? (<ActionDefinition[]>fromSource.actions).find((a) => a.name === ofName)
      : undefined;

    return ofAction
      ? new ActionInstance(ofAction, fromSource)
      : undefined;
  }

  /**
   * @param actionInstance the action instance to mutate
   * @param inputSettings JSON form of ActionInstance
   */
  private setInputsFromJSON(
    actionInstance: ActionInstance,
    actionInstanceObject: any
  ) {
    _.forEach(actionInstanceObject.inputSettings, (setting, name) => {
      if (_.isString(setting)) {
        actionInstance.inputSettings[name] = setting;
      } else {
        const inputtedAction = this.newActionInstanceByName(
          setting.of,
          setting.from
        );
        actionInstance.inputSettings[name] = inputtedAction;
        this.setInputsFromJSON(
          inputtedAction,
          setting
        );
      }
    });
    if (actionInstanceObject.data) {
      actionInstance.data = actionInstanceObject.data;
    }
  }
}
