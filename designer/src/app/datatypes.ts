import { Component } from '@angular/compiler/src/core';
import * as _ from 'lodash';

// names should be HTML safe (TODO)

export interface ActionDefinition {
  name: string;
  readonly inputs: string[]; // TODO: input type
  readonly outputs: string[];
}

export interface ClicheActionDefinition extends ActionDefinition {
  readonly component: Component;
}

export class AppActionDefinition implements ActionDefinition {
  name: string;
  readonly inputs: string[] = []; // TODO: input type
  readonly outputs: string[] = [];
  private _rows: Row[] = [];
  // TODO: styling options

  constructor(name: string) {
    this.name = name;
  }

  get rows() {
    _.remove(this._rows, (row) => row.actions.length === 0);

    return this._rows;
  }

  toHTML() {
    let html = `<dv.action name="${this.name}">\n`;
    _.forEach(this.rows, (row) => {
      html += row.toHTML() + '\n';
    });
    html += `</dv.action>`;

    return html;
  }
}

export class Row {
  readonly actions: ActionInstance[] = [];
  // TODO: Flex Settings;

  constructor() {}

  toHTML() {
    let html = '  <div class="dvd-row">\n';
    _.forEach(this.actions, (action) => {
      html += action.toHTML();
    });
    html += `  </div>\n`;

    return html;
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
  readonly of: ActionDefinition;
  readonly from: App | ClicheInstance | ClicheDefinition;
  readonly inputSettings: { [inputName: string]: any } = {};

  constructor(
    of: ActionDefinition,
    from: App | ClicheInstance | ClicheDefinition
  ) {
    this.of = of;
    this.from = from;
  }

  toHTML(): string {
    let html = `    <${this.from.name}.${this.of.name}\n`;
    _.forEach(this.inputSettings, (val, key) => {
      html += `      ${key}="${val}"\n`; // TODO: non-string vals
    });
    html += `    />\n`;

    return html;
  }
}

export interface ClicheDefinition {
  readonly name: string;
  readonly actions: ClicheActionDefinition[];
  // TODO: config options
}

export class ClicheInstance {
  readonly name: string;
  readonly of: ClicheDefinition;
  readonly config: { [s: string]: any } = {};

  constructor(name: string, of: ClicheDefinition) {
    this.name = name;
    this.of = of;
  }

  get actions() {
    return this.of.actions;
  }
}

export class App {
  name: string;
  readonly actions: AppActionDefinition[] = [];
  readonly pages: AppActionDefinition[] = []; // subset of actions
  homepage: AppActionDefinition; // member of pages
  readonly cliches: ClicheInstance[] = [];

  constructor(name: string) {
    this.name = name;
    this.actions = [new AppActionDefinition('new-action-1')];
    this.pages = [...this.actions];
    this.homepage = this.pages[0];
  }

  static fromJSON(
    jsonString: string,
    clicheDefinitions: ClicheDefinition[]
  ): App {
    const appJSON = JSON.parse(jsonString);

    const app = new App(appJSON.name);

    // clear default action
    app.actions.pop();
    app.pages.pop();

    appJSON.cliches.forEach((ci) => {
      const of = clicheDefinitions.find((cd) => cd.name === ci.of.name);
      const clicheInstance = new ClicheInstance(ci.name, of);
      Object.assign(clicheInstance.config, ci.config);
      app.cliches.push(clicheInstance);
    });

    appJSON.actions.forEach((aad) => {
      const actionDef = new AppActionDefinition(aad.name);
      actionDef.inputs.push.apply(actionDef.inputs, aad.inputs);
      actionDef.outputs.push.apply(actionDef.inputs, aad.outputs);
      aad._rows.forEach((r) => {
        const row = new Row();
        r.actons.forEach((ai) => {
          const fromInstance = app.cliches.find((c) => c.name === ai.from.name);
          const from = fromInstance ? fromInstance.of : app;
          // TODO: this will fail unless app actions are topo sorted
          const of = (<ActionDefinition[]>from.actions)
            .find((a) => a.name === ai.of.name);
          const actionInst = new ActionInstance(of, fromInstance || app);
          Object.assign(actionInst.inputSettings, ai.inputSettings);
          row.actions.push(actionInst);
        });
        actionDef.rows.push(row);
      });
      app.actions.push(actionDef);
    });

    appJSON.pages.forEach((p) => {
      const page = app.actions.find((a) => a.name === p);
      app.pages.push(page);
    });

    app.homepage = app.actions.find((a) => a.name === appJSON.homepage);

    return app;
  }

  toJSON(): string {
    return JSON.stringify({
      name: this.name,
      actions: this.actions,
      pages: this.pages.map((p) => p.name),
      homepage: this.homepage.name,
      cliches: this.cliches
    });
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
        'dv-cli': '0.0.1'
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
        { path: '', action: `${this.name}-${this.homepage.name}` },
        ..._.map(this.pages, (page) => (
          { path: page.name, action: `${this.name}-${page.name}` }
        ))
      ]
    }, null, '  ');
  }
}
