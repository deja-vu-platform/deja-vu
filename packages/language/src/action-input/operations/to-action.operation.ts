import { ActionSymbolTable } from '../../symbolTable';

export interface InputFromContext {
  readonly input: string;
  readonly field: string;
}

/**
 * Turn an input action into a normal action
 *
 * This pass does two things:
 *   - sets the name of the action
 *   - changes every symbol accessed from the context into an input
 *
 * @param symbolTable the symbol table of the input action
 * @param context the context information given by its containing action
 * @param inputsFromContext array where the inputs from context should be saved
 */
export function toAction(
  _symbolTable: ActionSymbolTable, _context: ActionSymbolTable,
  _inputsFromContext: InputFromContext[]) {
  const recurse = (expr) => expr.toAction();
  const binOpRecurse = (leftExpr, op, rightExpr) =>
    `${leftExpr.toAction()}${op.sourceString}${rightExpr.toAction()}`;

  return {
    Element: (element) => element.toAction(),
    NormalElement: (startTag, content, endTag) =>
      startTag.toAction() + content.toAction() + endTag.sourceString,
    VoidElement: (open, elementName, attributes, close) =>
      `${open.sourceString} ${elementName.sourceString} ` +
      `${attributes.toAction().join(' ')} ${close.sourceString}`,
    StartTag: (open, elementName, attributes, close) =>
      `${open.sourceString} ${elementName.sourceString} ` +
      `${attributes.toAction().join(' ')} ${close.sourceString}`,
    Attribute: (attributeName, eq, expr) =>
      `${attributeName.sourceString}${eq.sourceString}${expr.toAction()}`,
    Expr_un: recurse, Expr_bin: recurse, Expr_member: recurse,
    Expr_literal: recurse,
    Expr_name: (_name) =>  { throw new Error(_name); },
    Expr_input: (input) => input.toAction(),
    Expr_element: (element) => element.sourceString,

    UnExpr_not: (not, expr) => `${not.sourceString}${expr.toAction()}`,
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,

    MemberExpr: (nameOrInput, dot, names) =>
      nameOrInput.sourceString + dot.sourceString + names.sourceString,

    Literal_number: (number) => number.sourceString,
    Literal_text: (openQuote, text, closeQuote) =>
      openQuote.sourceString + text.sourceString + closeQuote.sourceString,
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments.toAction().join(', ') +
      closeCb.sourceString,
    Literal_array: (openSb, exprs, closeSb) =>
      openSb.sourceString +
      exprs.toAction().join(', ') +
      closeSb.sourceString,
    Content_element: (element) => element.toAction(),
    Content_text: (text) => text.sourceString,
    input: (ds, input) => ds.sourceString + input.sourceString
  };
}
