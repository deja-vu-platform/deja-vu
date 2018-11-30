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
    Expr_member: recurse, Expr_literal: recurse,
    Expr_input: (inputNode) => inputNode.saveInputs(),
    Expr_element: (_element) => {}, // TODO

    UnExpr_not: (_not, expr) => expr.saveInputs(),
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,
    TerExpr: (cond, _q, ifTrue, _c, ifFalse) => {
      cond.saveInputs();
      ifTrue.saveInputs();
      ifFalse.saveInputs();
    },

    MemberExpr: binOpRecurse,

    Literal_number: (_number) => {},
    Literal_text: (_openQuote, _text, _closeQuote) => {},
    Literal_true: (_true) => {}, Literal_false: (_false) => {},
    Literal_obj: (_openCb, propAssignments, _closeCb) =>
      propAssignments.saveInputs(),
    Literal_array: (_openSb, exprs, _closeSb) => exprs.saveInputs(),
    Content_element: (element) => element.saveInputs(),
    Content_text: (_text) => {},
    name: (_letter, _rest)  => {},
    input: (ds, inputName) => {
      symbolTable[ds.sourceString + inputName.sourceString] = { kind: 'input' };
    }
  };
}
