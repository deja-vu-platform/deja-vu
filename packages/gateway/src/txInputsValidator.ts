import { ActionTag } from './actionHelper';

import { RequestInvalidError } from './requestProcessor';

import * as _ from 'lodash';

import { VM } from 'vm2';


export interface InputValuesMap {
  [fqtag: string]: {[inputName: string]: any};
}

export interface TxContext {
  [fieldName: string]: any;
}

export class TxInputsValidator {
  private static Eval(unparsedExpr: string, context: TxContext): any {
    // TODO: need to ensure that the eval is safe. There's probably a couple
    //  of hacks a malicious user could do to workaround our checks.

    // We wrap the expr in parenthesis so that the parser throws an error if
    // what's inside is not a valid JS expression (rules out statements).
    // TODO: we could restrict this even further, since template exprs can't
    //  have assignments, etc
    return new VM({ sandbox: context }).run(`(${unparsedExpr})`);
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

    console.log(JSON.stringify(actions));
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
    console.log('Getting ' + fqtag + inputName);
    const unparsedExpr = _.get(actions, [fqtag, inputName]);
    if (unparsedExpr  === undefined) {
      // it's an internal input
      console.log('internal input');

      return;
    }
    console.log('got some value to check ' + inputValue);
    const expectedValue = TxInputsValidator.Eval(unparsedExpr, context);
    console.log('expected value is ' + expectedValue);
    if (!_.isEqual(expectedValue, inputValue)) {
      throw new RequestInvalidError(
        `The value obtained for ${fqtag}.${inputName} is not the expected ` +
        `one (${inputValue} is not equal to ${expectedValue})`);
    }
  }
}
