import { Component } from '@angular/compiler/src/core';
import { EventEmitter } from '@angular/core';
import * as graphlib from 'graphlib';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

import dvdAppStyles from './dvd-app-styles';
import { exportDvExpr } from './expression.compiler';


/**
 * A named collection of components
 * Could be App, ClicheDefinition, ClicheInstance, etc.
 */
export interface ComponentCollection {
  name: string;
  components: ComponentDefinition[];
}

/**
 * an input map for each named component input
 */
export interface ComponentInputs {
  // ioName is what you would put $ in front of to reference
  // the value is the name of the property set in the included component
  [forInput: string]: { [ioName: string]: string };
}

/**
 * inputs that are present on **every** component
 * cliche components should already have these
 * these need to be added to app components
 */
export const OMNIPRESENT_INPUTS = [
  'hidden'
];

export const usedClichesConfig = {};

/**
 * Component Definition
 * Defines the name you use, the inputs you provide,
 * and the outputs and content you get when you instantiate an component
 */
export interface ComponentDefinition {
  name: string;
  readonly inputs: string[]; // TODO: input type
  readonly outputs: string[];
  readonly componentInputs: ComponentInputs;
  ioDescriptions: { [ioName: string]: string };
}


export interface ClicheComponentDefinition extends ComponentDefinition {
  readonly component: Component;
  description: string;
}

/**
 * Definitions of Inputs or Outputs for AppComponentDefinition
 */
// tslint:disable-next-line interface-name
export interface IO {
  name: string;
  value: string; // default constant for input, expression for output
}

export interface InInput {
  name: string;
  of: ComponentInstance;
}

export const defaultAppComponentStyles = {
  backgroundColor: 'transparent',
  borderWidth: '0',
  borderColor: 'black',
  borderStyle: 'solid',
  padding: '8px'
};
export type AppComponentStyles = typeof defaultAppComponentStyles;

export class AppComponentDefinition implements ComponentDefinition {
  name: string;
  readonly inputSettings: IO[] = [];
  readonly outputSettings: IO[] = [];
  private _rows: Row[] = [];
  transaction = false;
  // App Components cannot have component inputs
  readonly componentInputs: Readonly<ComponentInputs> = {};
  // TODO: export styles
  readonly styles = _.cloneDeep(defaultAppComponentStyles);
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
    _.remove(this._rows, (row) => row.components.length === 0);

    return this._rows;
  }

  getChildren(includeInputs = false): ComponentInstance[] {
    return this.rows
      .map((r) => r.components
        .map((a) => includeInputs
        ? [a, ...a.getInputtedComponents(true)]
        : [a]
        )
        .flat()
      )
      .flat();
  }

  /**
   * Determines whether or not this contains an instance of an component
   * @param deep false: A parent of B; true: A ancestor of B
   */
  contains(componentDefinition: ComponentDefinition, deep = false) {
    return this.rows.some((r) =>
      r.components.some((a) => a.isOrContains(componentDefinition, deep))
    );
  }

  /**
   * Find the child component instance with given cliche and component name
   * Returns undefined if none is found
   * TODO: stop assuming each cliche x component combo is unique
   */
  findChild(
    clicheName: string,
    componentName: string
  ): ComponentInstance | undefined {
    for (const row of this.rows) {
      const component = row.components.find((a) =>
        a.from.name === clicheName && a.of.name === componentName
      );
      if (component) { return component; }
    }
  }

  toHTML(): string {
    let html = `<dv.component name="${this.name}"`;
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
    html += `<div class="dvd-component ${this.name}">\n`;
    _.forEach(this.rows, (row) => {
      html += row.toHTML() + '\n';
    });
    html += '</div>\n';
    if (this.transaction) {
      html += '</dv.tx>\n';
    }
    html += '</dv.component>';

    return html;
  }

  toCSS(): string {
    let css = `.dvd-component.${this.name} {`;
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
      // app components do not have component inputs
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
 * Components in AppComponentDefinitions are grouped into rows for stylistic reasons
 */
export class Row {
  readonly components: ComponentInstance[] = [];
  hJust: keyof typeof flexJustify = 'c';
  vAlign: keyof typeof flexAlign = 's';

  constructor() {}

  toHTML(): string {

    let html = `  <div class="dvd-row j${this.hJust} a${this.vAlign}">\n`;
    _.forEach(this.components, (component) => {
      html += component.toHTML();
    });
    html += `  </div>\n`;

    return html;
  }

  toJSON() {
    return {
      components: this.components.map((component) => component.toJSON()),
      hJust: this.hJust,
      vAlign: this.vAlign
    };
  }
}

/**
 * An Component Instance is a single usage (HTML Tag) of an component
 * It has its own input settings and its own outputs
 * But these are defined by its definition
 */
export class ComponentInstance {
  readonly id = uuidv4();
  readonly of: ComponentDefinition;
  readonly from: ComponentCollection;
  // type is ComponentInstance iff inputName in of.componentInputs
  readonly inputSettings: { [inputName: string]: string | ComponentInstance } = {};
  // TODO: export styles
  data?: any; // currently only used for the text widget
  readonly styles = { stretch: false };
  // used to tell UI when input settings change
  // not data, but putting it elsewhere requires uglier code
  readonly shouldReLink: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    ofComponent: ComponentDefinition,
    from: ComponentCollection
  ) {
    this.of = ofComponent;
    this.from = from;
  }

  // needed for component processing
  get fqtag(): string {
    return `${this.from.name}-${this.of.name}`;
  }

  get isAppComponent(): boolean {
    return (this.from instanceof App);
  }

  get isText(): boolean {
    return (
      this.from.name === 'dv'
      && this.of.name === 'text'
    );
  }

  isOrContains(componentDefinition: ComponentDefinition, deep: boolean): boolean {
    return (
      // is
      this.of === componentDefinition
      // contains (content, app component only)
      || (
        this.of instanceof AppComponentDefinition
        && this.of.contains(componentDefinition, deep)
      )
      // contains (component input, cliche component only but no need to check this)
      || _.some(
          _.pickBy(this.inputSettings, (_v, k) => k in this.of.componentInputs),
          (a: ComponentInstance) => a && a.isOrContains(componentDefinition, deep)
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
        ? exportDvExpr(val)
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
        + (this.inputSettings['*content'] as ComponentInstance)
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
   * @param deep also walk the inputs of any inputted components
   * @param callback function called at each input
   * (inInput) is a private arg
   */
  walkInputs(deep: boolean,
    callback: (
      name: string,
      value: string | ComponentInstance,
      ofComponent: ComponentInstance,
      inInput?: InInput
    ) => void,
    inInput?: InInput
  ): void {
    this.of.inputs.forEach((name) => {
      const value = this.inputSettings[name];
      if (deep && value instanceof ComponentInstance) {
        value.walkInputs(true, callback, { name, of: this });
      }
      callback(name, value, this, inInput);
    });
  }

  getInputtedComponents(deep: boolean): ComponentInstance[] {
    const inputtedComponents: ComponentInstance[] = [];
    this.walkInputs(deep, (name, value) => {
      if (value instanceof ComponentInstance) {
        inputtedComponents.push(value);
      }
    });

    return inputtedComponents;
  }
}

// AppComponentInstance vs ClicheComponentInstance isn't relevant
// For the cases when it does matter, inspecting .of is fine

/**
 * A cliche is defined by its names and the components it has
 */
export interface ClicheDefinition {
  readonly name: string;
  readonly components: ClicheComponentDefinition[];
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

  get components() {
    return this.of.components;
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
  static dvCliche: ComponentCollection;
  static clicheDefinitions: ClicheDefinition[];

  name: string; // no dashes
  readonly components: AppComponentDefinition[];
  readonly pages: AppComponentDefinition[]; // subset of components
  homepage: AppComponentDefinition; // member of pages
  readonly cliches: ClicheInstance[] = [];
  readonly ioDescriptions = {};

  // need consistent object to return
  private readonly _componentCollections: ComponentCollection[] = [];

  /**
   * Create an app from a save file
   */
  static fromJSON(jsonString: string): App {
    const appJSON = JSON.parse(jsonString);
    if (_.isEmpty(appJSON)) {
      return new App('myapp');
    }

    const app = new App(appJSON.name);

    // clear default component
    app.components.pop();
    app.pages.pop();

    appJSON.cliches.forEach((ci) => {
      const ofCliche = App.clicheDefinitions.find((cd) => cd.name === ci.of);
      const clicheInstance = new ClicheInstance(ci.name, ofCliche);
      Object.assign(clicheInstance.config, ci.config);
      usedClichesConfig[ci.name] = { config: clicheInstance.config };
      app.cliches.push(clicheInstance);
    });

    appJSON.components.forEach((aad) => {
      const componentDef = new AppComponentDefinition(aad.name);
      componentDef.inputSettings
        .push.apply(componentDef.inputSettings, aad.inputSettings);
      componentDef.outputSettings
        .push.apply(componentDef.outputSettings, aad.outputSettings);
      componentDef.transaction = aad.transaction;
      Object.assign(componentDef.styles, aad.styles);
      aad.rows.forEach((r) => {
        const row = new Row();
        r.components.forEach((ai) => {
          const componentInst = app.newComponentInstanceByName(ai.of, ai.from);
          Object.assign(componentInst.styles, ai.styles);
          app.setInputsFromJSON(componentInst, ai);
          row.components.push(componentInst);
        });
        row.hJust = r.hJust;
        row.vAlign = r.vAlign;
        componentDef.rows.push(row);
      });
      app.components.push(componentDef);
    });
    app.components.sort((aad1, aad2) => aad1.name < aad2.name ? -1 : 1);

    appJSON.pages.forEach((p) => {
      const page = app.components.find((a) => a.name === p);
      app.pages.push(page);
    });

    app.homepage = app.components.find((a) => a.name === appJSON.homepage);

    return app;
  }

  constructor(name: string) {
    this.name = name;
    this.components = [new AppComponentDefinition('home')];
    this.pages = [...this.components];
    this.homepage = this.pages[0];
    this._componentCollections.push(this);
  }

  private tsortComponents(): AppComponentDefinition[] {
    const graph = new graphlib.Graph();
    this.components.forEach((a) => graph.setNode(a.name));
    this.components.forEach((a1) => {
      this.components.forEach((a2) => {
        if (a1.contains(a2)) {
          graph.setEdge(a1.name, a2.name);
        }
      });
    });

    return graphlib.alg.topsort(graph)
      .reverse()
      .map((name) => this.components.find((a) => a.name === name));
  }

  toJSON() {
    return {
      name: this.name,
      components: this.tsortComponents()
        .map((component) => component.toJSON()),
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
        { path: '', component: this.homepage.name },
        ..._.map(this.pages, (page) => (
          { path: page.name, component: page.name }
        ))
      ]
    }, null, '  ');
  }

  toCSS(): string {
    return (
      dvdAppStyles
      + '\n'
      + this.components.reduce((css, component) => css + '\n\n' + component.toCSS(), '')
    );
  }

  // We need a consistent object to return or Angular freaks out
  get componentCollections(): ComponentCollection[] {
    this._componentCollections.splice(0);
    this._componentCollections.push(this);
    this._componentCollections.push(App.dvCliche);
    this._componentCollections.push.apply(
      this._componentCollections,
      this.cliches
        .sort(({ name: nameA }, { name: nameB }) =>
          nameA === nameB ? 0 : (nameA < nameB ? -1 : 1)
        )
    );

    return this._componentCollections;
  }

  /**
   * @param ofName name of component declared in app, imported cliche, or DV cliche
   * @param fromName name of cliche instance, or app, or the DV cliche
   * @return a new component instance or undefined if the names do not resolve
   */
  newComponentInstanceByName(ofName: string, fromName: string): ComponentInstance {
    const fromSource = this.componentCollections.find((c) => c.name === fromName);

    const ofComponent = fromSource
      ? (<ComponentDefinition[]>fromSource.components).find((a) => a.name === ofName)
      : undefined;

    return ofComponent
      ? new ComponentInstance(ofComponent, fromSource)
      : undefined;
  }

  deleteClicheInstance(ci: ClicheInstance) {
    this.components.forEach((ad) => {
      ad.rows.forEach((r) => {
        _.remove(r.components, (ai) => ai.from === ci);
      });
    });
    _.remove(this.cliches, (c) => c === ci);
  }

  /**
   * @param componentInstance the component instance to mutate
   * @param inputSettings JSON form of ComponentInstance
   */
  private setInputsFromJSON(
    componentInstance: ComponentInstance,
    componentInstanceObject: any
  ) {
    _.forEach(componentInstanceObject.inputSettings, (setting, name) => {
      if (_.isString(setting)) {
        componentInstance.inputSettings[name] = setting;
      } else {
        const inputtedComponent = this.newComponentInstanceByName(
          setting.of,
          setting.from
        );
        componentInstance.inputSettings[name] = inputtedComponent;
        this.setInputsFromJSON(
          inputtedComponent,
          setting
        );
      }
    });
    if (componentInstanceObject.data) {
      componentInstance.data = componentInstanceObject.data;
    }
  }
}
