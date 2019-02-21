import { ActionSymbolTable, pretty } from '../../symbolTable';

import * as _ from 'lodash';
import { isInput, NAV_SPLIT_REGEX } from '../../action/operations/shared';


export interface InputFromContext {
  readonly input: string;
  readonly field: string;
}

function captureToInput(field: string) {
  return `$capture__${_.replace(field, /\.|-/g, '_')}`;
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
    Expr_un: recurse, Expr_bin: recurse, Expr_ter: recurse,
    Expr_member: recurse, Expr_literal: recurse,

    Expr_input: (input) => input.sourceString,
    Expr_element: (element) => element.sourceString,

    Expr_parens: (op, expr, cp) => op.sourceString +
      expr.capturesToInputs() + cp.sourceString,

    UnExpr_not: (not, expr) => `${not.sourceString}${expr.capturesToInputs()}`,
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_mul: binOpRecurse, BinExpr_div: binOpRecurse,
    BinExpr_mod: binOpRecurse,

    BinExpr_lt: binOpRecurse, BinExpr_gt: binOpRecurse,
    BinExpr_le: binOpRecurse, BinExpr_ge: binOpRecurse,

    BinExpr_eq: binOpRecurse, BinExpr_neq: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,

    TerExpr: (cond, _q, ifTrue, _c, ifFalse) =>
      `${cond.capturesToInputs()} ? ${ifTrue.capturesToInputs()} : ` +
      ifFalse.capturesToInputs(),

    MemberExpr: (nameOrInputNode, restNode, _rest) => {
      const nameOrInput = nameOrInputNode.sourceString;
      const rest = restNode.sourceString;
      if (isInput(nameOrInput)) {
        return nameOrInput + restNode.sourceString;
      } else {
        const name = nameOrInput;
        if (_.has(symbolTable, name)) {
          const stEntry = _.get(symbolTable, name);
          if (stEntry.kind === 'cliche' || stEntry.kind === 'app') {
            const action = rest.slice(1)
              .split(NAV_SPLIT_REGEX)[0];
            if (_.has(symbolTable, [name, 'symbolTable', action])) {
              return name + rest;
            }
          } else if (stEntry.kind === 'action') {
            return name + rest;
          } else {
            throw new Error(`Unexpected entry type for ${pretty(stEntry)}`);
          }
        }
        if (_.has(context, name)) {
          const action = rest.slice(1)
            .split('.', 1)[0];
          const memberAndOutputAccess = rest.slice(action.length + 1);
          const [memberAccess, outputAccess] = memberAndOutputAccess.slice(1)
            .split(NAV_SPLIT_REGEX);
          const field = name + '.' + action + '.' + memberAccess;

          const input = captureToInput(field);
          inputsFromContext.push({ input: input, field: field });

          const operator = memberAndOutputAccess.indexOf('?.') > 0 ? '?.' : '.';

          return outputAccess ? input + operator + outputAccess : input;
        }
        throw new Error(`${name} (${name + rest}) not found in ` +
          `symbol table ${pretty(symbolTable)} or context ${pretty(context)}`);
      }
    },
    Literal_number: (num) => num.sourceString,
    Literal_text: (stringLiteral) => stringLiteral.sourceString,
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (objLiteral) => objLiteral.capturesToInputs(),
    ObjectLiteral_noTrailingComma: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments.capturesToInputs()
        .join(', ') +
      closeCb.sourceString,
    ObjectLiteral_trailingComma: (openCb, propAssignments, _comma, closeCb) =>
      openCb.sourceString +
      propAssignments.capturesToInputs()
        .join(', ') +
      closeCb.sourceString,
    Literal_array: (openSb, exprs, closeSb) =>
      openSb.sourceString +
      exprs.capturesToInputs()
        .join(', ') +
      closeSb.sourceString,
    Content_element: (element) => element.capturesToInputs(),
    Content_text: (text) => text.sourceString,
    input: (ds, input) => ds.sourceString + input.sourceString
  };
}
