/**
 * For parsing Deja Vu expressions
 * (which are slightly different than Angular expressions)
 */

import * as expressions from 'angular-expressions';
import * as ohm from 'ohm-js';
import grammarString from './expression.grammar.ohm';

/**
 * `-` is legal in dv but not ng
 * `$` is legal in ng but not dv
 *   ($ is used in dv but not considered part of a name)
 */
export function dvToNgName(dvName: string) {
  return dvName.replace(/-/g, '$');
}

const grammar = ohm.grammar(grammarString);
const semantics = grammar.createSemantics();
/**
 * Converts a DV expression to an Ng expression
 */
semantics.addOperation('toNgExpr', {
  _iter: (args) => args.map((arg) => arg.toNgExpr())
    .join(''),
  _nonterminal: (args) => args.map((arg) => arg.toNgExpr())
    .join(''),
  _terminal: function() { return this.sourceString; },
  name: (leadingLetter, rest) => dvToNgName(
    leadingLetter.toNgExpr() + rest.toNgExpr()
  ),
  BinExpr_lt: (left, lt, right) => left.toNgExpr() + '<' + right.toNgExpr(),
  BinExpr_gt: (left, gt, right) => left.toNgExpr() + '>' + right.toNgExpr(),
  BinExpr_le: (left, le, right) => left.toNgExpr() + '<=' + right.toNgExpr(),
  BinExpr_ge: (left, ge, right) => left.toNgExpr() + '>=' + right.toNgExpr()
});
/**
 * Returns an array of strings, the names (inputs & outputs)
 *    referenced in the expression
 */
semantics.addOperation('getNames', {
  _iter: (args) => args.map((arg) => arg.getNames())
    .flat(),
  _nonterminal: (args) => args.map((arg) => arg.getNames())
    .flat(),
  _terminal: () => [],
  MemberExpr: function(nameOrInput, nav) { return [this.sourceString]; },
  input: function(dollarSign, name) { return [this.sourceString]; }
});

export default function compileDvExpr(dvExpr: string) {
  const parsedExpr = semantics(grammar.match(dvExpr));
  const names: string[] = parsedExpr.getNames();
  const ngExpr: string = parsedExpr.toNgExpr();
  const evaluate: (scope: Object) => any = expressions.compile(ngExpr);

  return {
    names,
    evaluate
  };
}
