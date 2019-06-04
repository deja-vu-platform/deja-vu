import { ActionSymbolTable } from '../../symbolTable';


export function saveInputs(symbolTable: ActionSymbolTable) {
  const recurse = (expr) => expr.saveInputs();
  const binOpRecurse = (leftExpr, _op, rightExpr) => {
    leftExpr.saveInputs();
    rightExpr.saveInputs();
  };

  return {
    Element: (element) => element.saveInputs(),
    NormalElement: (startTag, content, _endTag) => {
      startTag.saveInputs();
      content.saveInputs();
    },
    VoidElement: (_open, _elementName, attributes, _close) =>
      attributes.saveInputs(),
    StartTag: (_open, _elementName, attributes, _close) =>
      attributes.saveInputs(),
    Attribute: (_attributeName, _eq, expr) => expr.saveInputs(),

    Expr_un: recurse, Expr_bin: recurse, Expr_ter: recurse,
    Expr_prop: recurse, Expr_literal: recurse,
    Expr_input: (inputNode) => inputNode.saveInputs(),
    Expr_element: (_element) => {}, // TODO
    Expr_parens: (_op, expr, _cp) => expr.saveInputs(),

    UnExpr_not: (_not, expr) => expr.saveInputs(),
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_mul: binOpRecurse, BinExpr_div: binOpRecurse,
    BinExpr_mod: binOpRecurse,

    BinExpr_lt: binOpRecurse, BinExpr_gt: binOpRecurse,
    BinExpr_le: binOpRecurse, BinExpr_ge: binOpRecurse,

    BinExpr_eq: binOpRecurse, BinExpr_neq: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,
    TerExpr: (cond, _q, ifTrue, _c, ifFalse) => {
      cond.saveInputs();
      ifTrue.saveInputs();
      ifFalse.saveInputs();
    },

    PropExpr_io: binOpRecurse,
    PropExpr_dynamic: (e1, _sqb1, e2, _s1b2) => {
      e1.saveInputs();
      e2.saveInputs();
    },
    PropExpr_static: (e, _nav, _name) => e.saveInputs(),
    Literal_number: (_number) => {},
    Literal_text: (_stringLiteral) => {},
    Literal_true: (_true) => {}, Literal_false: (_false) => {},
    Literal_obj: (objLiteral) => objLiteral.saveInputs(),
    ObjectLiteral_noTrailingComma: (_openCb, propAssignments, _closeCb) =>
      propAssignments.asIteration()
        .saveInputs(),
    ObjectLiteral_trailingComma: (_openCb, propAssignments, _comma, _closeCb) =>
      propAssignments.asIteration()
        .saveInputs(),
    Literal_array: (_openSb, exprs, _closeSb) => exprs
      .asIteration()
      .saveInputs(),
    Content_element: (element) => element.saveInputs(),
    Content_text: (_text) => {},
    name: (_letter, _rest)  => {},
    input: (ds, inputName) => {
      symbolTable[ds.sourceString + inputName.sourceString] = { kind: 'input' };
    },
    PropAssignment: (_name, _c, expr) => expr.saveInputs()
  };
}
