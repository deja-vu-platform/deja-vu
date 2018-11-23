import { ActionSymbolTable, pretty } from '../../symbolTable';

import * as _ from 'lodash';
import { isInput } from "../../action/operations/shared";


export interface InputFromContext {
  readonly input: string;
  readonly field: string;
}

function captureToInput(field: string) {
  return `$capture__${_.replace(field, /\./g, '_')}`;
}

/**
 * Turn all references to the action input's context (captures) to inputs
 *
 * @param symbolTable the symbol table of the input action
 * @param context the context information given by its containing action
 * @param inputsFromContext array where the inputs from context should be saved
 */
export function capturesToInputs(
  symbolTable: ActionSymbolTable, context: ActionSymbolTable,
  inputsFromContext: InputFromContext[]) {
  const recurse = (expr) => expr.capturesToInputs();
  const binOpRecurse = (leftExpr, op, rightExpr) =>
    leftExpr.capturesToInputs() + op.sourceString +
    rightExpr.capturesToInputs();

  return {
    Element: (element) => element.capturesToInputs(),
    NormalElement: (startTag, content, endTag) =>
      startTag.capturesToInputs() + content.capturesToInputs() +
      endTag.sourceString,
    VoidElement: (open, elementName, attributes, close) =>
      `${open.sourceString} ${elementName.sourceString} ` +
      `${attributes.capturesToInputs().join(' ')} ${close.sourceString}`,
    StartTag: (open, elementName, attributes, close) =>
      `${open.sourceString} ${elementName.sourceString} ` +
      `${attributes.capturesToInputs().join(' ')} ${close.sourceString}`,
    Attribute: (attributeName, eq, expr) =>
      attributeName.sourceString + eq.sourceString + expr.capturesToInputs(),
    Expr_un: recurse, Expr_bin: recurse, Expr_member: recurse,
    Expr_literal: recurse,

    Expr_input: (input) => input.sourceString,
    Expr_element: (element) => element.sourceString,

    UnExpr_not: (not, expr) => `${not.sourceString}${expr.capturesToInputs()}`,
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,

    MemberExpr: (nameOrInputNode, restNode, _rest) => {
      const nameOrInput = nameOrInputNode.sourceString;
      if (isInput(nameOrInput)) {
        return nameOrInput + restNode.sourceString;
      } else {
        const name = nameOrInput;
        if (_.has(symbolTable, name)) {
          return name + restNode.sourceString;
        } else if (_.has(context, name)) {
          const field = name + restNode.sourceString;
          const input = captureToInput(field);
          inputsFromContext.push({ input: input, field: field });

          return input;
        } else {
          throw new Error(`${name} not found in ` +
            `symbol table ${pretty(symbolTable)} or context ${pretty(context)}`);
        }
      }
    },
    Literal_number: (number) => number.sourceString,
    Literal_text: (openQuote, text, closeQuote) =>
      openQuote.sourceString + text.sourceString + closeQuote.sourceString,
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments.capturesToInputs().join(', ') +
      closeCb.sourceString,
    Literal_array: (openSb, exprs, closeSb) =>
      openSb.sourceString +
      exprs.capturesToInputs().join(', ') +
      closeSb.sourceString,
    Content_element: (element) => element.capturesToInputs(),
    Content_text: (text) => text.sourceString,
    input: (ds, input) => ds.sourceString + input.sourceString
  };
}
