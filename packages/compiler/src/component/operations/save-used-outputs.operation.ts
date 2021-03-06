import { ComponentSymbolTable, pretty, StEntry } from '../../symbolTable';
import { isInput, NAV_SPLIT_REGEX } from './shared';

import * as _ from 'lodash';


/**
 * Parse attribute exprs to discover the used outputs of included components.
 *
 * For the time being, instead of figuring out what the real outputs of a
 * concept component are, we parse the attribute exprs to discover what outputs
 * are used and save this information in the symbol table. If the user is
 * using an output that doesn't exist, ng will throw an error later.
 *
 * It is useful to know what outputs are used so that when we are converting
 * a component node to its corresponding ng template node we can bind the
 * used output.
 */
export function saveUsedOutputs(symbolTable: ComponentSymbolTable) {
  const recurse = (expr) => expr.saveUsedOutputs();
  const binOpRecurse = (leftExpr, _op, rightExpr) => {
    leftExpr.saveUsedOutputs();
    rightExpr.saveUsedOutputs();
  };
  let throwErrorOnSymbolNotFound = true;

  return {
    Element: (element) => element.saveUsedOutputs(),
    NormalElement: (startTag, content, _endTag) => {
      startTag.saveUsedOutputs();
      content.saveUsedOutputs();
    },
    VoidElement: (_open, _elementName, attributes, _close) =>
      attributes.saveUsedOutputs(),
    StartTag: (_open, _elementName, attributes, _close) =>
      attributes.saveUsedOutputs(),
    Attribute: (_attributeName, _eq, expr) => expr.saveUsedOutputs(),

    Expr_un: recurse, Expr_bin: recurse, Expr_ter: recurse,
    Expr_prop: recurse, Expr_literal: recurse,
    Expr_input: (input) => input.sourceString,
    Expr_element: (element) => {
      // We need to figure out if the component input is using an output from this
      // component. To do so, we can simply do the same thing we are doing for this
      // component, the only difference being that we shouldn't throw an error if
      // we don't find a symbol on the table (because it could be a symbol
      // that's local to the component input)
      throwErrorOnSymbolNotFound = false;
      element.saveUsedOutputs();
      throwErrorOnSymbolNotFound = true;
    },
    Expr_parens: (_op, expr, _cp) => expr.saveUsedOutputs(),

    UnExpr_not: (_not, expr) => expr.saveUsedOutputs(),
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_mul: binOpRecurse, BinExpr_div: binOpRecurse,
    BinExpr_mod: binOpRecurse,

    BinExpr_lt: binOpRecurse, BinExpr_gt: binOpRecurse,
    BinExpr_le: binOpRecurse, BinExpr_ge: binOpRecurse,

    BinExpr_eq: binOpRecurse, BinExpr_neq: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,

    TerExpr: (cond, _q, ifTrue, _c, ifFalse) => {
      cond.saveUsedOutputs();
      ifTrue.saveUsedOutputs();
      ifFalse.saveUsedOutputs();
    },
    PropExpr_io: (nameOrInputNode, _dot, namesNode) =>  {
      const nameOrInput = nameOrInputNode.sourceString;
      const names = namesNode.sourceString;
      const fullMemberAccess = nameOrInput + names;
      if (isInput(nameOrInput)) {
        return;
      }
      const [ conceptOrComponentAlias, ...rest ] = _
        .split(fullMemberAccess, NAV_SPLIT_REGEX);
      if (!_.has(symbolTable, conceptOrComponentAlias)) {
        if (throwErrorOnSymbolNotFound) {
          throw new Error(
            `${conceptOrComponentAlias} not found in ` +
            `symbol table ${pretty(symbolTable)}`);
        } else {
          return;
        }
      }
      const stEntry: StEntry = symbolTable[conceptOrComponentAlias];
      switch (stEntry.kind) {
        case 'concept':
          const conceptName = conceptOrComponentAlias;
          const [ componentName, output ] = rest;
          if (!_.has(stEntry, [ 'symbolTable', componentName ])) {
            if (throwErrorOnSymbolNotFound) {
              throw new Error(
                `${conceptName}.${componentName} not found in ` +
                `symbol table ${pretty(symbolTable)}`);
            } else {
              return;
            }
          }
          _.set(
            stEntry.symbolTable[componentName], [ 'symbolTable', output ],
            { kind: 'output' });
          break;
        case 'component':
          _.set(stEntry, [ 'symbolTable', rest[0]], { kind: 'output' });
          break;
        default:
          // nothing
          break;
      }
    },
    PropExpr_dynamic: (e1, _sqb1, e2, _s1b2) => {
      e1.saveUsedOutputs();
      e2.saveUsedOutputs();
    },
    PropExpr_static: (e, _nav, _name) => e.saveUsedOutputs(),
    Literal_number: (_number) => {},
    Literal_text: (_stringLiteral) => {},
    Literal_true: (_true) => {}, Literal_false: (_false) => {},
    Literal_obj: (objLiteral) => objLiteral.saveUsedOutputs(),
    ObjectLiteral_noTrailingComma: (_openCb, propAssignments, _closeCb) =>
      propAssignments.asIteration()
        .saveUsedOutputs(),
    ObjectLiteral_trailingComma: (_openCb, propAssignments, _comma, _closeCb) =>
      propAssignments.asIteration()
        .saveUsedOutputs(),
    Literal_array: (_openSb, exprs, _closeSb) =>
      exprs.asIteration()
        .saveUsedOutputs(),
    Content_element: (element) => element.saveUsedOutputs(),
    Content_text: (_text) => {},
    Content_interpolation: (interpolation) => interpolation.saveUsedOutputs(),
    Interpolation: (_cb1, expr, _cb2) => expr.saveUsedOutputs(),
    PropAssignment: (_name, _c, expr) => expr.saveUsedOutputs()
  };
}
