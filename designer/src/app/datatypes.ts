import { Component } from '@angular/compiler/src/core';
import * as graphlib from 'graphlib';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

// names should be HTML safe (TODO: ensure this)

export interface ActionCollection {
  name: string;
  actions: ActionDefinition[];
}

export interface ActionInputs {
  // ioName is what you would put $ in front of to reference
  // the value is the name of the property set in the included action
  [forInput: string]: { [ioName: string]: string };
}

export interface ActionDefinition {
  name: string;
  readonly inputs: string[]; // TODO: input type
  readonly outputs: string[];
  readonly actionInputs: ActionInputs;
}

export interface ClicheActionDefinition extends ActionDefinition {
  readonly component: Component;
}

// tslint:disable-next-line interface-name
export interface IO {
  name: string;
  value: string;
}

export class AppActionDefinition implements ActionDefinition {
  name: string;
  readonly inputSettings: IO[] = [];
  readonly outputSettings: IO[] = [];
  private _rows: Row[] = [];
  transaction = false;
  // App Actions cannot have action inputs
  readonly actionInputs: Readonly<ActionInputs> = {};
  // TODO: styling options

  constructor(name: string) {
    this.name = name;
  }

  get inputs(): string[] {
    return this.inputSettings.map((io) => io.name);
  }

  get outputs(): string[] {
    return this.outputSettings.map((io) => io.name);
  }

  get rows(): Row[] {
    _.remove(this._rows, (row) => row.actions.length === 0);

    return this._rows;
  }

  get children(): ActionInstance[] {
    return (<ActionInstance[]>[]).concat(...this.rows.map((r) => r.actions));
  }

  /**
   * Determines whether or not this contains an instance of an action
   * @param deep false: A parent of B; true: A ancestor of B
   */
  contains(actionDefinition: ActionDefinition, deep = false) {
    return this.rows.some((r) =>
      r.actions.some((a) => (
        a.isOrContains(actionDefinition, deep) ||
        _.some(a.inputSettings, (v) =>
          v && !_.isString(v) && v.isOrContains(actionDefinition, deep)
        )
      ))
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
      html += `\n  ${name}$=${value}`;
    });
    if (outputs.length > 0) {
      html += '\n';
    }
    html += '>\n';
    if (this.transaction) {
      html += '<dv.tx>\n';
    }
    _.forEach(this.rows, (row) => {
      html += row.toHTML() + '\n';
    });
    if (this.transaction) {
      html += '</dv.tx>\n';
    }
    html += '</dv.action>';

    return html;
  }

  toJSON() {
    return {
      name: this.name,
      inputSettings: this.inputSettings,
      outputSettings: this.outputSettings,
      rows: this.rows.map((row) => row.toJSON()),
      transaction: this.transaction
      // app actions do not have action inputs
    };
  }

}

export class Row {
  readonly actions: ActionInstance[] = [];
  // TODO: Flex Settings;

  constructor() {}

  toHTML(): string {
    let html = '  <div class="dvd-row">\n';
    _.forEach(this.actions, (action) => {
      html += action.toHTML();
    });
    html += `  </div>\n`;

    return html;
  }

  toJSON() {
    return {
      actions: this.actions.map((action) => action.toJSON())
    };
  }

  addAction(action: ActionInstance, index?: number) {
    if (index === undefined) {
      this.actions.push(action);
    } else {
      this.actions.splice(index, 0, action);
    }
  }

  removeAction(index: number): ActionInstance {
    return this.actions.splice(index, 1)[0];
  }

  // to do a move within row, do remove and then add
}

export class ActionInstance {
  readonly id = uuidv4();
  readonly of: ActionDefinition;
  readonly from: ActionCollection;
  // type is ActionInstance iff inputName in of.actionInputs
  readonly inputSettings: { [inputName: string]: string | ActionInstance } = {};
  data?: any; // currently only used for the text widget

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
    return (this.of instanceof App);
  }

  isOrContains(actionDefinition: ActionDefinition, deep: boolean): boolean {
    return (
      this.of === actionDefinition
      || (
        deep
        && this.of['contains']
        && (<AppActionDefinition>this.of)
          .contains(actionDefinition, deep)
      )
    );
  }

  /**
   * @param extraIndents should not be provided externally
   */
  toHTML(extraIndents = 0): string {
    // text widget is just plain HTML static content
    if (this.of.name === 'text' && this.from.name === 'dv') {
      return `    <div>${this.data}</div>\n`;
    }

    const baseNumIndents = 4;
    const xIdnt = '  '.repeat(extraIndents);

    let html = `    <${this.from.name}.${this.of.name}`;

    _.forEach(this.inputSettings, (val, key) => {
      const strVal = _.isString(val)
        ? val
        : val.toHTML(extraIndents + 1)
          .slice(baseNumIndents, -1); // strip leading indent and ending newline
      html += `\n${xIdnt}      ${key}=${strVal}`;
    });

    if (_.size(this.inputSettings) === 0) {
      html += ' ';
    } else {
      html += `\n${xIdnt}    `;
    }
    html += '/>\n';

    return html;
  }

  toJSON() {
    const json = {
      of: this.of.name,
      from: this.from.name,
      inputSettings: this.inputSettings
    };
    if (this.data) {
      json['data'] = this.data;
    }

    return json;
  }
}

export interface ClicheDefinition {
  readonly name: string;
  readonly actions: ClicheActionDefinition[];
  // TODO: config options
}

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

export class App {
  // populated in cliche.module.ts to avoid circular dependencies
  static dvCliche: ActionCollection;
  static clicheDefinitions: ClicheDefinition[];

  name: string; // no dashes
  readonly actions: AppActionDefinition[];
  readonly pages: AppActionDefinition[]; // subset of actions
  homepage: AppActionDefinition; // member of pages
  readonly cliches: ClicheInstance[] = [];
  // need consistent object to return
  private readonly _actionCollections: ActionCollection[] = [];

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
      aad.rows.forEach((r) => {
        const row = new Row();
        r.actions.forEach((ai) => {
          const actionInst = app.newActionInstanceByName(ai.of, ai.from);
          app.setInputsFromJSON(actionInst, ai);
          row.actions.push(actionInst);
        });
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
