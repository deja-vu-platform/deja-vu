import { ActionSymbolTable, pretty, StEntry } from '../../symbolTable';
import { isInput } from './shared';

import * as _ from 'lodash';


/**
 * Parse attribute exprs to discover the used outputs of included actions.
 *
 * For the time being, instead of figuring out what the real outputs of a
 * cliché action are, we parse the attribute exprs to discover what outputs
 * are used and save this information in the symbol table. If the user is
 * using an output that doesn't exist, ng will throw an error later.
 *
 * It is useful to know what outputs are used so that when we are converting
 * an action node to its corresponding ng template node we can bind the
 * used output.
 */
export function saveUsedOutputs(symbolTable: ActionSymbolTable) {
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
    Expr_member: recurse, Expr_literal: recurse,
    Expr_input: (input) => input.sourceString,
    Expr_element: (element) => {
      // We need to figure out if the action input is using an output from this
      // action. To do so, we can simply do the same thing we are doing for this
      // action, the only difference being that we shouldn't throw an error if
      // we don't find a symbol on the table (because it could be a symbol
      // that's local to the action input)
      throwErrorOnSymbolNotFound = false;
      element.saveUsedOutputs();
      throwErrorOnSymbolNotFound = true;
    },
    Expr_parens: (_op, expr, _cp) => expr.saveUsedOutputs(),

    UnExpr_not: (_not, expr) => expr.saveUsedOutputs(),
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,
    BinExpr_is: binOpRecurse,
    TerExpr: (cond, _q, ifTrue, _c, ifFalse) => {
      cond.saveUsedOutputs();
      ifTrue.saveUsedOutputs();
      ifFalse.saveUsedOutputs();
    },
    MemberExpr: (nameOrInputNode, _dot, namesNode) =>  {
      const nameOrInput = nameOrInputNode.sourceString;
      const names = namesNode.sourceString;
      const fullMemberAccess = nameOrInput + names;
      if (isInput(nameOrInput)) {
        return;
      }
      const [ clicheOrActionAlias, ...rest ] = _.split(fullMemberAccess, '.');
      if (!_.has(symbolTable, clicheOrActionAlias)) {
        if (throwErrorOnSymbolNotFound) {
          throw new Error(
            `${clicheOrActionAlias} not found in ` +
            `symbol table ${pretty(symbolTable)}`);
        } else {
          return;
        }
      }
      const stEntry: StEntry = symbolTable[clicheOrActionAlias];
      switch (stEntry.kind) {
        case 'cliche':
          const clicheName = clicheOrActionAlias;
          const [ actionName, output ] = rest;
          if (!_.has(stEntry, `symbolTable.${actionName}`)) {
            throw new Error(
              `${clicheName}.${actionName} not found in ` +
              `symbol table ${pretty(symbolTable)}`);
          }
          _.set(
            stEntry.symbolTable[actionName], `symbolTable.${output}`,
            { kind: 'output' });
          break;
        case 'action':
          _.set(stEntry, `symbolTable.${rest[0]}`, { kind: 'output' });
          break;
        default:
          // nothing
          break;
      }
    },

    Literal_number: (_number) => {},
    Literal_text: (_openQuote, _text, _closeQuote) => {},
    Literal_true: (_true) => {}, Literal_false: (_false) => {},
    Literal_obj: (_openCb, propAssignments, _closeCb) =>
      propAssignments.asIteration()
        .saveUsedOutputs(),
    Literal_array: (_openSb, exprs, _closeSb) =>
      exprs.asIteration()
        .saveUsedOutputs(),
    Content_element: (element) => element.saveUsedOutputs(),
    Content_text: (_text) => {},
    PropAssignment: (_name, _c, expr) => expr.saveUsedOutputs()
  };
}
