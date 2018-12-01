import { readFileSync } from 'fs';

import * as path from 'path';

import { ActionSymbolTable } from '../symbolTable';

import {
  saveUsedActions
} from '../action/operations/save-used-actions.operation';
import {
  capturesToInputs, InputFromContext
} from './operations/captures-to-inputs.operation';

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
   * @param context the context information, given by its enclosing action
   *
   * @return a Deja Vu action. The result of compiling an action input
   *         is a valid Deja Vu action, which can be then compiled into an
   *         ng component (see ActionCompiler).
   */
  compile(actionInputContents: string, context: ActionSymbolTable)
    : CompiledActionInput {
    const wrappedActionInput = this.setActionName(actionInputContents);

    const symbolTable: ActionSymbolTable = {};
    const inputsFromContext: InputFromContext[] = [];
    this.semantics
      .addOperation('saveUsedActions', saveUsedActions(symbolTable))
      .addOperation(
        'capturesToInputs',
        capturesToInputs(symbolTable, context, inputsFromContext));

    const s = this.semantics(wrappedActionInput);
    s.saveUsedActions();
    const action = s.capturesToInputs();

    return {
      action: action,
      inputsFromContext: inputsFromContext
    };
  }

  private setActionName(actionInputContents: string): string {
    const name = `anonymous-${ActionInputCompiler.GetUniqueId()}`;
    const wrappedActionInputContents =
      (actionInputContents.trim()
        .startsWith('<dv.action')) ?
        actionInputContents
          .replace('<dv.action', `<dv.action name="${name}"`) :
        `<dv.action name="${name}">${actionInputContents}</dv.action>`;

    const matchResult = this.grammar.match(wrappedActionInputContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error in action input:' + matchResult.message);
    }

    return matchResult;
  }
}
