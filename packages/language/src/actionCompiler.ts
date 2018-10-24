import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';

import { SymbolTable } from './symbolTable';

import * as _ from 'lodash';

const ohm = require('ohm-js');


export class ActionCompiler {
  private readonly grammar;
  private readonly semantics;

  private static GetSymbolsOperation(symbolTable: SymbolTable) {
    return {
      Element: (element) => { return; }
    };
  }

  private static ToNgTemplateOperation(symbolTable: SymbolTable) {
    return {
      Element: (element) => { return; }
    };
  }

  constructor() {
    const grammarPath = path.join(__dirname, 'dv.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
    this.semantics = this.grammar.createSemantics();
  }

  compile(actionContents: string, symbolTable: SymbolTable) {
    this.semantics
      .addOperation(
        'getSymbols', ActionCompiler.GetSymbolsOperation(symbolTable))
      .addOperation(
        'toNgTemplate', ActionCompiler.ToNgTemplateOperation(symbolTable));

    const matchResult = this.grammar.match(actionContents);
    if (matchResult.failed()) {
      throw new Error(matchResult.message);
    }
    const s = this.semantics(matchResult);
    console.log(JSON.stringify(symbolTable));
    s.getSymbols();
    console.log(JSON.stringify(symbolTable));
    s.toNgTemplate();
  }
}


class NgComponentBuilder {
  private inputs: string[] = [];
  private outputs: string[] = [];
  private fields: string[] = [];
  private style = '';

  private static GetClassName(actionName: string): string {
    return `${_.upperFirst(_.camelCase(actionName))}Component`;
  }

  private static GetSelector(appName: string, actionName: string): string {
    return `${appName}-${actionName}`;
  }

  constructor(
    private readonly appName: string,
    private readonly actionName: string, private readonly template: string) {}

  withInputs(inputs: string[]): NgComponentBuilder {
    this.inputs = inputs;
    return this;
  }

  withOutputs(outputs: string[]): NgComponentBuilder {
    this.outputs = outputs;
    return this;
  }

  withFields(fields: string[]): NgComponentBuilder {
    this.fields = fields;
    return this;
  }

  withStyle(style: string): NgComponentBuilder {
    this.style = style;
    return this;
  }

  build(): string {
    const selector = NgComponentBuilder
      .GetSelector(this.appName, this.actionName);
    const className = NgComponentBuilder.GetClassName(this.actionName);
    const outputFields = _.map(
      this.outputs, (output: string) =>
        `@Output() ${output} = new EventEmitter();`);
    const inputFields = _.map(
      this.inputs,  (input: string) => `@Input() ${input};`);
    const fields = _.map(this.fields, (field: string) => `${field};`);
    return `
      import { Component } from '@angular/core';

      @Component({
        selector: "${selector}",
        template: \`${this.template}\`,
        style: \`${this.style}\`
      })
      export class ${className} {
        ${outputFields.join()}
        ${inputFields.join()}
        ${fields.join()}
      }
    `;
  }
}
