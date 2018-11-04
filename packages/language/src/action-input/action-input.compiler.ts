import { readFileSync } from 'fs';

import * as path from 'path';

import { ActionSymbolTable} from '../symbolTable';

import { InputFromContext, toAction } from './operations/to-action.operation';
import { saveUsedActions } from '../action/operations/save-used-actions.operation';

const ohm = require('ohm-js');

import * as _ from 'lodash';


export interface CompiledActionInput {
  readonly inputsFromContext: InputFromContext[];
  readonly action: string;
}

const UNIQUE_ID_LENGTH = 10;

export class ActionInputCompiler {
  private readonly grammar;
  private readonly semantics;

  private static GetUniqueId(): string {
    const domain = 'abcdefghijklmnopqrstuvwxyz';
    return _
      .times(UNIQUE_ID_LENGTH, () => domain
        .charAt(Math.floor(Math.random() * domain.length)))
      .join('');
  }

  constructor() {
    const grammarPath = path.join(
      __dirname, '..', 'action', 'action.grammar.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
    this.semantics = this.grammar.createSemantics();
  }

  /**
   * Compiles the given action input contents to a valid action
   * @param actionInputContents the contents of the action to compile
   * @param context the context information given by its containing action
   *
   * @return an action
   */
  compile(actionInputContents: string, context: ActionSymbolTable)
    : CompiledActionInput {
    const symbolTable: ActionSymbolTable = {};
    const inputsFromContext: InputFromContext[] = [];
    this.semantics
      .addOperation('saveUsedActions', saveUsedActions(symbolTable))
      .addOperation(
        'toAction', toAction(symbolTable, context, inputsFromContext));

    const name = `anonymous-${ActionInputCompiler.GetUniqueId()}`;
    const wrappedActionInputContents =
      (actionInputContents.trim().startsWith('<dv.action')) ?
        actionInputContents
          .replace('<dv.action', `<dv.action name="${name}"`) :
        `<dv.action name="${name}">${actionInputContents}</dv.action>`;

    const matchResult = this.grammar.match(wrappedActionInputContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error in action input:' + matchResult.message);
    }
    const s = this.semantics(matchResult);
    s.saveUsedActions();
    const action = s.toAction();

    return {
      action: action,
      inputsFromContext: inputsFromContext
    };
  }
}
