import { readFileSync } from 'fs';

import * as path from 'path';

import { ComponentSymbolTable } from '../symbolTable';

import {
  saveUsedComponents
} from '../component/operations/save-used-components.operation';
import {
  capturesToInputs, InputFromContext
} from './operations/captures-to-inputs.operation';

const ohm = require('ohm-js');

import * as _ from 'lodash';


export interface CompiledComponentInput {
  readonly inputsFromContext: InputFromContext[];
  readonly component: string;
}

const UNIQUE_ID_LENGTH = 10;

export class ComponentInputCompiler {
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
      __dirname, '..', 'component', 'component.grammar.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
    this.semantics = this.grammar.createSemantics();
  }

  /**
   * Compiles the given component input contents to a valid component
   * @param componentInputContents the contents of the component to compile
   * @param context the context information, given by its enclosing component
   *
   * @return a Deja Vu component. The result of compiling an component input
   *         is a valid Deja Vu component, which can be then compiled into an
   *         ng component (see ComponentCompiler).
   */
  compile(componentInputContents: string, context: ComponentSymbolTable)
    : CompiledComponentInput {
    const wrappedComponentInput = this.setComponentName(componentInputContents);

    const symbolTable: ComponentSymbolTable = {};
    const inputsFromContext: InputFromContext[] = [];
    this.semantics
      .addOperation('saveUsedComponents', saveUsedComponents(symbolTable))
      .addOperation(
        'capturesToInputs',
        capturesToInputs(symbolTable, context, inputsFromContext));

    const s = this.semantics(wrappedComponentInput);
    s.saveUsedComponents();
    const component = s.capturesToInputs();

    return {
      component: component,
      inputsFromContext: inputsFromContext
    };
  }

  private setComponentName(componentInputContents: string): string {
    const name = `anonymous-${ComponentInputCompiler.GetUniqueId()}`;
    const wrappedComponentInputContents =
      (componentInputContents.trim()
        .startsWith('<dv.component')) ?
        componentInputContents
          .replace('<dv.component', `<dv.component name="${name}"`) :
        `<dv.component name="${name}">${componentInputContents}</dv.component>`;

    const matchResult = this.grammar.match(wrappedComponentInputContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error in component input:' + matchResult.message);
    }

    return matchResult;
  }
}
