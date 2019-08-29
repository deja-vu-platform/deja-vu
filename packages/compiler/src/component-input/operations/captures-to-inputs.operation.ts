import { ComponentSymbolTable, pretty } from '../../symbolTable';

import * as _ from 'lodash';
import { isInput, NAV_SPLIT_REGEX } from '../../component/operations/shared';


export interface InputFromContext {
  readonly input: string;
  readonly field: string;
}

function captureToInput(field: string) {
  return `$capture__${_.replace(field, /-|\./g, '_')}`;
}

/**
 * Turn all references to the component input's context (captures) to inputs
 *
 * @param symbolTable the symbol table of the input component
 * @param context the context information given by its wrapping component
 * @param inputsFromContext array where the inputs from context should be saved
 */
export function capturesToInputs(
  symbolTable: ComponentSymbolTable, context: ComponentSymbolTable,
  inputsFromContext: InputFromContext[]) {
  const recurse = (expr) => expr.capturesToInputs();
  const binOpRecurse = (leftExpr, op, rightExpr) =>
    leftExpr.capturesToInputs() + ' ' + op.sourceString + ' ' +
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
    Expr_prop: recurse, Expr_literal: recurse,

    Expr_input: (inputNode) => {
      const input = inputNode.sourceString;
      if (_.has(context, input)) {
        const capturedInput = captureToInput(input.slice(1));
        inputsFromContext.push({ input: capturedInput, field: input });

        return capturedInput;
      } else {
        return input;
      }
    },
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

    PropExpr_io: (nameOrInputNode, restNode, _rest) => {
      const nameOrInput = nameOrInputNode.sourceString;
      const rest = restNode.sourceString;
      if (isInput(nameOrInput)) {
        if (_.has(context, nameOrInput)) {
          // it's capturing an input from the context
          const capturedInput = captureToInput(nameOrInput.slice(1));
          inputsFromContext.push({ input: capturedInput, field: nameOrInput });

          return capturedInput + restNode.sourceString;
        } else {
          return nameOrInput + restNode.sourceString;
        }
      } else {
        const name = nameOrInput;
        if (_.has(symbolTable, name)) {
          const stEntry = _.get(symbolTable, name);
          if (stEntry.kind === 'concept' || stEntry.kind === 'app') {
            const component = rest.slice(1)
              .split(NAV_SPLIT_REGEX)[0];
            if (_.has(symbolTable, [name, 'symbolTable', component])) {
              return name + rest;
            }
          } else if (stEntry.kind === 'component') {
            return name + rest;
          } else {
            throw new Error(`Unexpected entry type for ${pretty(stEntry)}`);
          }
        }
        if (_.has(context, name)) {
          const component = rest.slice(1)
            .split('.', 1)[0];
          const memberAndOutputAccess = rest.slice(component.length + 1);
          const [memberAccess, outputAccess] = memberAndOutputAccess.slice(1)
            .split(NAV_SPLIT_REGEX);
          const field = name + '.' + component + '.' + memberAccess;

          const input = captureToInput(field);
          inputsFromContext.push({ input: input, field: field });

          const operator = memberAndOutputAccess.indexOf('?.') > 0 ? '?.' : '.';

          return outputAccess ? input + operator + outputAccess : input;
        }
        throw new Error(`${name} (${name + rest}) not found in ` +
          `symbol table ${pretty(symbolTable)} or context ${pretty(context)}`);
      }
    },
    PropExpr_dynamic: (e1, _sqb1, e2, _s1b2) =>
      `${e1.capturesToInputs()}[${e2.capturesToInputs()}]`,
    PropExpr_static: (e, nav, name) =>
      e.capturesToInputs() + nav.capturesToInputs() +
      name.capturesToInputs(),
    Literal_number: (num) => num.sourceString,
    Literal_text: (stringLiteral) => stringLiteral.sourceString,
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (objLiteral) => objLiteral.capturesToInputs(),
    ObjectLiteral_noTrailingComma: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments.capturesToInputs()
        .asIteration()
        .join(', ') +
      closeCb.sourceString,
    ObjectLiteral_trailingComma: (openCb, propAssignments, _comma, closeCb) =>
      openCb.sourceString +
      propAssignments.capturesToInputs()
        .asIteration()
        .join(', ') +
      closeCb.sourceString,
    Literal_array: (openSb, exprs, closeSb) =>
      openSb.sourceString +
      exprs.asIteration()
        .capturesToInputs()
        .join(', ') +
      closeSb.sourceString,
    Content_element: (element) => element.capturesToInputs(),
    Content_text: (text) => text.sourceString,
    Content_interpolation: (interpolation) => interpolation.capturesToInputs(),
    Interpolation: (m1, e, m2) => m1.sourceString +
      e.capturesToInputs() + m2.sourceString,
    input: (ds, input) => ds.sourceString + input.sourceString
  };
}
