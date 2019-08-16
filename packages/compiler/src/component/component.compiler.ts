import { readFileSync } from 'fs';

import * as path from 'path';

import {
  AppOutputStEntry, ComponentStEntry, ComponentSymbolTable, ComponentSymbolTableStEntry,
  ConceptStEntry, EntryKind, InputStEntry, OutputStEntry, SymbolTable
} from '../symbolTable';

import * as _ from 'lodash';
import {
  NgComponentBuilder, NgField, NgOutput
} from './builders/ng-component.builder';

import { getComponentName } from './operations/get-component-name.operation';
import { saveInputs } from './operations/save-inputs.operation';
import { saveOutputs } from './operations/save-outputs.operation';
import { saveUsedComponents } from './operations/save-used-components.operation';
import { saveUsedOutputs } from './operations/save-used-outputs.operation';
import { classNameToNgField } from './operations/shared';
import { toNgTemplate } from './operations/to-ng-template.operation';

import * as prettier from 'prettier';

const ohm = require('ohm-js');


export interface CompiledComponent {
  readonly name: string;
  readonly className: string;
  readonly selector: string;
  readonly ngComponent: string;
  readonly ngTemplate: string;
  readonly componentInputs?: ReadonlyArray<CompiledComponent>;
}

export class ComponentCompiler {
  private readonly grammar;

  private static FilterKind(kind: EntryKind, symbolTable: ComponentSymbolTable)
    : ComponentSymbolTableStEntry[] {
    return _
      .chain(symbolTable)
      .values()
      .filter((entry) => entry.kind === kind)
      .value();
  }

  private static GetNgFieldsFromEntries(
    entries: InputStEntry[] | OutputStEntry[]): string[] {
    return _.map(
      entries,
      (entry: InputStEntry | OutputStEntry): string =>
        entry.kind === 'input' ? entry.ngInputField : entry.ngOutputField);
  }

  private static GetNgFields(
    kind: 'input' | 'output', symbolTable: ComponentSymbolTable): string[] {
    return ComponentCompiler.GetNgFieldsFromEntries(
      <InputStEntry[] | OutputStEntry[]> ComponentCompiler
        .FilterKind(kind, symbolTable));
  }

  private static GetClassName(componentName: string): string {
    return `${_.upperFirst(_.camelCase(componentName))}Component`;
  }

  private static GetTemplateUrl(componentName: string): string {
    return `./${componentName.toLowerCase()}.component.html`;
  }

  private static GetSelector(appName: string, componentName: string): string {
    return `${appName}-${componentName}`;
  }

  constructor() {
    const grammarPath = path.join(__dirname, 'component.grammar.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
  }

  /**
   * Compiles the given component contents and updates the symbol table
   * @param appName the name of the application the component is part of
   * @param componentContents the contents of the component to compile
   * @param symbolTable the symbol table to update
   * @param style the CSS for the component
   *
   * @return the compiled component object
   */
  compile(
    appName: string, componentContents: string, symbolTable: SymbolTable,
    style?: string, pages?: string[])
    : CompiledComponent {
    const thisComponentSymbolTable: ComponentSymbolTable = {};
    const componentInputs: CompiledComponent[] = [];
    const semantics = this.grammar.createSemantics();
    semantics
      .addOperation('getComponentName', getComponentName())
      .addOperation('saveUsedComponents', saveUsedComponents(thisComponentSymbolTable))
      .addOperation('saveUsedOutputs', saveUsedOutputs(thisComponentSymbolTable))
      .addOperation('saveInputs', saveInputs(thisComponentSymbolTable))
      .addOperation('saveOutputs', saveOutputs(thisComponentSymbolTable))
      .addOperation(
        'toNgTemplate', toNgTemplate(
          appName, thisComponentSymbolTable, componentInputs, symbolTable));

    const matchResult = this.grammar.match(componentContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error:' + matchResult.message);
    }
    const s = semantics(matchResult);
    const thisComponentName = s.getComponentName();
    s.saveUsedComponents(); // mutates thisComponentSymbolTable
    _.set(symbolTable, [appName, thisComponentName], {
      kind: 'component',
      symbolTable: thisComponentSymbolTable
    });
    s.saveUsedOutputs();
    s.saveInputs();
    s.saveOutputs();
    const ngTemplate = s.toNgTemplate();

    const className = ComponentCompiler.GetClassName(thisComponentName);
    const selector = ComponentCompiler.GetSelector(appName, thisComponentName);
    const templateUrl = ComponentCompiler.GetTemplateUrl(thisComponentName);

    const ngComponentBuilder = new NgComponentBuilder(
      templateUrl, className, selector);

    const fields: NgField[] =  _
      .chain(ComponentCompiler.FilterKind('concept', thisComponentSymbolTable))
      .map((conceptEntry: ConceptStEntry): ComponentStEntry[] =>
        <ComponentStEntry[]> ComponentCompiler
          .FilterKind('component', conceptEntry.symbolTable))
      .flatten()
      // Include aliased components
      .concat(ComponentCompiler.FilterKind('component', thisComponentSymbolTable))
      .map((conceptEntry: ComponentStEntry): string[] =>
        ComponentCompiler.GetNgFields('output', conceptEntry.symbolTable))
      .flatten()
      .map((fieldName: string): NgField => ({ name: fieldName }))
      .value();

    const componentInputFields: NgField[] = _.map(
      componentInputs, (componentInput) => ({
        name: classNameToNgField(componentInput.className),
        value: componentInput.className
      }));
    const appOutputFields = _.map(
      ComponentCompiler.FilterKind('app-output', thisComponentSymbolTable),
      (appOutputEntry: AppOutputStEntry): NgOutput => ({
        name: appOutputEntry.ngOutputField,
        expr: appOutputEntry.expr
      }));

    const isPage = _.includes(pages, thisComponentName);
    const ngComponent = ngComponentBuilder
      .withStyle(style)
      .addInputs(ComponentCompiler.GetNgFields('input', thisComponentSymbolTable))
      .addOutputs(appOutputFields)
      .addFields(fields)
      .addFields(componentInputFields)
      .withComponentImports(
        _.map(componentInputs, (componentInput: CompiledComponent) => ({
          className: componentInput.className,
          componentName: componentInput.name
        })))
      .build(isPage);

    return {
      name: thisComponentName,
      className: className,
      selector: selector,
      ngComponent: prettier.format(ngComponent, { parser: 'typescript' }),
      ngTemplate: prettier.format(ngTemplate, { parser: 'angular' }),
      componentInputs: componentInputs
    };
  }
}
