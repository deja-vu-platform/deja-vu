import { ActionTag } from './actionHelper';

import { RequestInvalidError } from './requestProcessor';

import * as _ from 'lodash';

import { VM } from 'vm2';

import { transformSync } from '@babel/core';
import * as elvis from '@babel/plugin-proposal-optional-chaining';


export interface InputValuesMap {
  [fqtag: string]: {[inputName: string]: any};
}

export interface TxContext {
  [fieldName: string]: any;
}

export class TxInputsValidator {
  private static Eval(unparsedExpr: string, context: TxContext): any {
    // Since we need to handle `?.`, which is not part of JS, we use babel
    // to polyfill the template expr
    const polyfilledCode = transformSync(
      // We wrap the expr in parenthesis so that the parser throws an error if
      // what's inside is not a valid JS expression (rules out statements).
      // TODO: we could restrict this even further, since template exprs can't
      //  have assignments, use `new`, etc
      `(${unparsedExpr})`, { plugins: [elvis] }) // polyfills `?.`
      .code;
    console.log(`Running code ${polyfilledCode}`);

    // This is safer than `eval`. It runs the code in a sandbox.
    const vm = new VM();
    _.forEach(context, vm.freeze); // don't let template exprs modify context

    return vm.run(polyfilledCode);
  }

  public static Validate(
    inputValues: InputValuesMap, txActions: ActionTag[], context: TxContext)
     : void {
    // fqtag -> { i1: expr1, ..., in: exprn }
    const actions = {};
    for (const txAction of txActions) {
      _.forEach(txAction.inputs, (unparsedExpr: string, input: string) => {
        const inputName = input.startsWith('[') ?
          input.slice(1, -1) : input;
        _.set(actions, [txAction.fqtag, inputName], unparsedExpr);
      });
    }

    // We do the checking by inputs. For each input value we receive, we
    // evaluate the expr that appears in the html source code and check that
    // we get the same value.
    _.forEach(inputValues, (input, actionFqTag: string) => {
      _.forEach(input, (inputValue: any, inputName: string) => {
        TxInputsValidator.ValidateInput(
          actionFqTag, inputName, inputValue, context, actions);
      });
    });
  }

  private static ValidateInput(
    fqtag: string, inputName: string, inputValue: any,
    context: {[name: string]: any}, actions)
    : void {
    const unparsedExpr = _.get(actions, [fqtag, inputName]);
    if (unparsedExpr  === undefined) {
      console.log(
        `Not checking ${fqtag}.${inputName} since it's internal input`);

      return;
    }
    console.log(`Checking ${fqtag}.${inputName}: ${inputValue}`);
    const expectedValue = TxInputsValidator.Eval(unparsedExpr, context);
    console.log(`Expected value for ${fqtag}.${inputName} is ${expectedValue}`);
    if (!_.isEqual(expectedValue, inputValue)) {
      throw new RequestInvalidError(
        `The value obtained for ${fqtag}.${inputName} is not the expected ` +
        `one (${inputValue} is not equal to ${expectedValue})`);
    }
  }
}
