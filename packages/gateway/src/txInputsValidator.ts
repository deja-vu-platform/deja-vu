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
    console.log(
      `Running code "${polyfilledCode}" (pollyfilled from "${unparsedExpr}") ` +
      `with context ${JSON.stringify(context)}`);

    // This is safer than `eval`. It runs the code in a sandbox.
    const vm = new VM();
    // `freeze` prevents template exprs from modifying the context.
    // For some reason, doing `forEach(context, vm.freeze)` doesn't work
    // sometimes
    _.forEach(context, (value: any, key: string) => {
      // It's important not to return the result of `vm.freeze` because
      // `vm.freeze` returns the freezed value, which could be `false` and cause
      // the `forEach` to stop
      vm.freeze(value, key);
    });

    // I couldn't find a flag for returning `undefined` to the sandboxed script
    // if a reference doesn't exist in the context, so we have to do this hack
    // TODO: find a better alternative
    while (true) {
      try {
        return vm.run(polyfilledCode);
      } catch (e) {
        const m = e.message.match(/(.*) is not defined/);
        if (m) {
          console.log(`Adding ${m[1]} to context with value undefined`);
          vm.freeze(undefined, m[1]);
          continue;
        }
        throw e;
      }
    }
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
    // evaluate the expr that appears in the HTML source code and check that
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
    if (unparsedExpr === undefined) {
      console.log(
        `Not checking ${fqtag}.${inputName} since it's an internal input`);

      return;
    }
    console.log(`Checking ${fqtag}.${inputName}: ${inputValue}`);
    const expectedValue = TxInputsValidator.Eval(unparsedExpr, context);
    console.log(`Expected value for ${fqtag}.${inputName} is ${expectedValue}`);
    // TODO: handle the case in which the expected value is `undefined` and
    // the input value is something other than `undefined` and it's ok
    // because the behavior of the action is to use a default value for an
    // input if none is given
    if (!_.isEqual(expectedValue, inputValue)) {
      throw new RequestInvalidError(
        `The value obtained for ${fqtag}.${inputName} is not the expected ` +
        `one (${inputValue} is not equal to ${expectedValue})`);
    }
  }
}
