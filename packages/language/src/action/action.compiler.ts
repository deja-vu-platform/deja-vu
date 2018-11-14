import { readFileSync } from 'fs';

import * as path from 'path';

import {
  ActionStEntry, ActionSymbolTable, ClicheStEntry, InputStEntry, EntryKind,
  OutputStEntry, SymbolTable, ActionSymbolTableStEntry
} from '../symbolTable';

import * as _ from 'lodash';
import { NgComponentBuilder, NgField } from './ng-component.builder';

import { saveUsedActions } from './operations/save-used-actions.operation';
import { saveInputs } from './operations/save-inputs.operation';
import { toNgTemplate } from './operations/to-ng-template.operation';
import { saveUsedOutputs } from './operations/save-used-outputs.operation';
import { getActionName } from './operations/get-action-name.operation';
import { classNameToNgField } from './operations/shared';

const ohm = require('ohm-js');


export interface CompiledAction {
  readonly className: string;
  readonly selector: string;
  readonly ngComponent: string;
  readonly actionInputs?: ReadonlyArray<CompiledAction>;
}

export class ActionCompiler {
  private readonly grammar;

  private static FilterKind(kind: EntryKind, symbolTable: ActionSymbolTable)
    : ActionSymbolTableStEntry[] {
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
    kind: 'input' | 'output', symbolTable: ActionSymbolTable): string[] {
    return ActionCompiler.GetNgFieldsFromEntries(
      <InputStEntry[] | OutputStEntry[]> ActionCompiler
        .FilterKind(kind, symbolTable));
  }

  private static GetClassName(actionName: string): string {
    return `${_.upperFirst(_.camelCase(actionName))}Component`;
  }

  private static GetSelector(appName: string, actionName: string): string {
    return `${appName}-${actionName}`;
  }

  constructor() {
    const grammarPath = path.join(__dirname, 'action.grammar.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
  }

  /**
   * Compiles the given action contents and updates the symbol table
   * @param appName the name of the application the action is part of
   * @param actionContents the contents of the action to compile
   * @param symbolTable the symbol table to update
   *
   * @return the compiled action object
   */
  compile(appName: string, actionContents: string, symbolTable: SymbolTable)
    : CompiledAction {
    const thisActionSymbolTable: ActionSymbolTable = {};
    const actionInputs: CompiledAction[] = [];
    const semantics = this.grammar.createSemantics();
    semantics
      .addOperation('getActionName', getActionName())
      .addOperation('saveUsedActions', saveUsedActions(thisActionSymbolTable))
      .addOperation('saveUsedOutputs', saveUsedOutputs(thisActionSymbolTable))
      .addOperation('saveInputs', saveInputs(thisActionSymbolTable))
      .addOperation(
        'toNgTemplate', toNgTemplate(
          appName, thisActionSymbolTable, actionInputs));

    const matchResult = this.grammar.match(actionContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error:' + matchResult.message);
    }
    const s = semantics(matchResult);
    const thisActionName = s.getActionName();
    s.saveUsedActions(); // mutates thisActionSymbolTable
    _.set(symbolTable, [appName, thisActionName], {
      kind: 'action',
      symbolTable: thisActionSymbolTable
    });
    s.saveUsedOutputs();
    s.saveInputs();
    const ngTemplate = s.toNgTemplate();
    const className = ActionCompiler.GetClassName(thisActionName);
    const selector = ActionCompiler.GetSelector(appName, thisActionName);
    const ngComponentBuilder = new NgComponentBuilder(
      ngTemplate, className, selector);

    const fields: NgField[] =  _
      .chain(ActionCompiler.FilterKind('cliche', thisActionSymbolTable))
      .map((clicheEntry: ClicheStEntry): ActionStEntry[] =>
        <ActionStEntry[]> ActionCompiler
          .FilterKind('action', clicheEntry.symbolTable))
      .flatten()
      .map((clicheEntry: ActionStEntry): string[] =>
        ActionCompiler.GetNgFields('output', clicheEntry.symbolTable))
      .flatten()
      .map((fieldName: string): NgField => ({ name: fieldName }))
      .value();

    const actionInputFields: NgField[] = _.map(
      actionInputs, (actionInput) => ({
        name: classNameToNgField(actionInput.className),
        value: actionInput.className
      }));
    const ngComponent = ngComponentBuilder
      .addInputs(ActionCompiler.GetNgFields('input', thisActionSymbolTable))
      .addOutputs(ActionCompiler.GetNgFields('output', thisActionSymbolTable))
      .addFields(fields)
      .addFields(actionInputFields)
      .withActionImports(
        _.map(actionInputs, (actionInput: CompiledAction) => ({
          className: actionInput.className,
          actionName: actionInput.selector
        })))
      .build();

    return {
      className: className,
      selector: selector,
      ngComponent: ngComponent,
      actionInputs: actionInputs
    };
  }
}
