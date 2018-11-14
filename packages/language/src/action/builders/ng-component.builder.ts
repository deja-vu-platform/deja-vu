import * as _ from 'lodash';

export interface NgField {
  name: string;
  value?: any;
}

export class NgComponentBuilder {
  private inputs: string[] = [];
  private outputs: string[] = [];
  private fields: NgField[] = [];
  private actionImportStatements: string[] = [];
  private style = '';

  constructor(
    private readonly template: string,
    private readonly className: string,
    private readonly selector: string) {}

  addInputs(inputs: string[]): NgComponentBuilder {
    this.inputs.push(...inputs);
    return this;
  }

  addOutputs(outputs: string[]): NgComponentBuilder {
    this.outputs.push(...outputs);
    return this;
  }

  addFields(fields: NgField[]): NgComponentBuilder {
    this.fields.push(...fields);
    return this;
  }

  withActionImports(
    actionImports: { actionName: string, className: string }[]) {
    for (const actionImport of actionImports) {
      this.withActionImport(actionImport.actionName, actionImport.className);
    }
    return this;
  }

  withActionImport(actionName: string, className: string): NgComponentBuilder {
    this.actionImportStatements
      .push(`import { ${className} } from './${actionName}.html'`);
   return this;
  }

  withStyle(style: string): NgComponentBuilder {
    this.style = style;
    return this;
  }

  build(): string {
    const outputFields = _.map(
      this.outputs, (output: string) =>
        `@Output() ${output} = new EventEmitter();`);
    const inputFields = _.map(
      this.inputs,  (input: string) => `@Input() ${input};`);
    const fields = _.map(this.fields, (field: NgField) =>
      field.name + ((field.value) ?
        ` = ${JSON.stringify(field.value).slice(1, -1)};` :
        ';'));
    const actionImports = _.join(this.actionImportStatements, '\n');
    return `
      import { Component } from '@angular/core';
      ${_.isEmpty(inputFields) ?
        '' : 'import { Input } from \'@angular/core\';'}
      ${_.isEmpty(outputFields) ?
        '' : 'import { Output } from \'@angular/core\';'}
      ${actionImports}

      @Component({
        selector: "${this.selector}",
        template: \`${this.template}\`,
        style: \`${this.style}\`
      })
      export class ${this.className} {
        ${outputFields.join('\n  ')}
        ${inputFields.join('\n  ')}
        ${fields.join('\n  ')}
      }
    `;
  }
}
