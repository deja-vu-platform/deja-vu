import * as _ from 'lodash';

export class NgComponentBuilder {
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
        ${outputFields.join('\n  ')}
        ${inputFields.join('\n  ')}
        ${fields.join('\n  ')}
      }
    `;
  }
}