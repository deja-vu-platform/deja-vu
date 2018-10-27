import { readFileSync } from 'fs';

import * as path from 'path';

import {
  ActionStEntry, ActionSymbolTable, ClicheStEntry, InputStEntry, EntryKind,
  OutputStEntry, SymbolTable, ActionSymbolTableStEntry
} from '../symbolTable';

import * as _ from 'lodash';
import { NgComponentBuilder } from './ng-component.builder';

import { saveUsedActions } from './operations/save-used-actions.operation';
import { saveInputs} from './operations/save-inputs.operation';
import { toNgTemplate } from './operations/to-ng-template.operation';
import { saveUsedOutputs } from './operations/save-used-outputs.operation';
import { getActionName } from './operations/get-action-name.operation';

const ohm = require('ohm-js');


export class ActionCompiler {
  private readonly grammar;
  private readonly semantics;

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

  constructor() {
    const grammarPath = path.join(__dirname, 'action.grammar.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
    this.semantics = this.grammar.createSemantics();
  }

  compile(appName: string, actionContents: string, symbolTable: SymbolTable) {
    const thisActionSymbolTable: ActionSymbolTable = {};
    this.semantics
      .addOperation('getActionName', getActionName())
      .addOperation('saveUsedActions', saveUsedActions(thisActionSymbolTable))
      .addOperation('saveUsedOutputs', saveUsedOutputs(thisActionSymbolTable))
      .addOperation('saveInputs', saveInputs(thisActionSymbolTable))
      .addOperation('toNgTemplate', toNgTemplate(thisActionSymbolTable));

    const matchResult = this.grammar.match(actionContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error:' + matchResult.message);
    }
    const s = this.semantics(matchResult);
    const thisActionName = s.getActionName();
    console.log('Got action name' + thisActionName);
    console.log(JSON.stringify(symbolTable));
    s.saveUsedActions(); // mutates thisActionSymbolTable
    _.set(symbolTable, [appName, thisActionName], {
      kind: 'action',
      symbolTable: thisActionSymbolTable
    });
    s.saveUsedOutputs();
    s.saveInputs();
    console.log(JSON.stringify(symbolTable));
    const ngTemplate = s.toNgTemplate();
    const ngComponentBuilder = new NgComponentBuilder(
      appName, thisActionName, ngTemplate);

    const fields: string[] =  _
      .chain(ActionCompiler.FilterKind('cliche', thisActionSymbolTable))
      .map((clicheEntry: ClicheStEntry): ActionStEntry[] =>
        <ActionStEntry[]> ActionCompiler
          .FilterKind('action', clicheEntry.symbolTable))
      .flatten()
      .map((clicheEntry: ActionStEntry): string[] =>
        ActionCompiler.GetNgFields('output', clicheEntry.symbolTable))
      .flatten()
      .value();
    const ngComponent = ngComponentBuilder
      .withInputs(ActionCompiler.GetNgFields('input', thisActionSymbolTable))
      .withOutputs(ActionCompiler.GetNgFields('output', thisActionSymbolTable))
      .withFields(fields)
      .build();
    console.log(ngComponent);
  }
}
