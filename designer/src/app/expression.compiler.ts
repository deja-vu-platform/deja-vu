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
  // dv uses lt for < and gt for > since < and > conflict with HTML tags
  BinExpr_lt: (left, lt, right) => left.toNgExpr() + '<' + right.toNgExpr(),
  BinExpr_gt: (left, gt, right) => left.toNgExpr() + '>' + right.toNgExpr(),
  BinExpr_le: (left, le, right) => left.toNgExpr() + '<=' + right.toNgExpr(),
  BinExpr_ge: (left, ge, right) => left.toNgExpr() + '>=' + right.toNgExpr(),
  // angular-expressions is angular.js and does not support ?.
  // (angular.js treats . like angular treats ?. as far as I can tell)
  nav: (nav) => '.'
});
/**
 * Returns an array of strings, the names (inputs & outputs)
 *    referenced in the expression
 * Note that this returns object paths as well.
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
/**
 * We allow users of the designer to write > and < rather than gt and lt
 * The angular-expressions module treats . as ?. so we export . as ?.
 */
semantics.addOperation('toDvExpr', {
  _iter: (args) => args.map((arg) => arg.toDvExpr())
    .join(''),
  _nonterminal: (args) => args.map((arg) => arg.toDvExpr())
    .join(''),
  _terminal: function() { return this.sourceString; },
  name: (leadingLetter, rest) => leadingLetter.toDvExpr() + rest.toDvExpr(),
  // dv uses lt for < and gt for > since < and > conflict with HTML tags
  BinExpr_lt: (left, lt, right) => left.toDvExpr() + ' lt ' + right.toDvExpr(),
  BinExpr_gt: (left, gt, right) => left.toDvExpr() + ' gt ' + right.toDvExpr(),
  BinExpr_le: (left, le, right) => left.toDvExpr() + ' lt= ' + right.toDvExpr(),
  BinExpr_ge: (left, ge, right) => left.toDvExpr() + ' gt= ' + right.toDvExpr(),
  // angular-expressions is angular.js and does not support ?.
  // (angular.js treats . like angular treats ?. as far as I can tell)
  nav: (nav) => '?.'
});

export default function compileDvExpr(dvExpr: string): {
  names: string[];
  evaluate: (scope: Object) => any;
  parsedExpr?: ohm.Dict
} {
  if (!dvExpr) { return { names: [], evaluate: () => undefined }; }
  const parsedExpr = semantics(grammar.match(dvExpr));
  const names: string[] = (parsedExpr.getNames() as string[])
    .map((name) => name
        .replace(/\?/g, '') // ignore elvis operator
        .split('.')
        // tslint:disable-next-line no-magic-numbers
        .slice(0, name.startsWith('$') ? 1 : 3) // $input or cliche.action.input
        .join('.')
    ); // drop object path
  const ngExpr: string = parsedExpr.toNgExpr();
  const evaluate: (scope: Object) => any = expressions.compile(ngExpr);

  return {
    names,
    evaluate,
    parsedExpr
  };
}

export function exportDvExpr(dvdExpr: string): string {
  if (!dvdExpr) { return dvdExpr; }
  const { names, parsedExpr } = compileDvExpr(dvdExpr);
  let dvExpr: string = parsedExpr.toDvExpr();

  names.forEach((name) => {
    const nameWithElvis = name.replace(/\./g, '?.');
    dvExpr = dvExpr.split(nameWithElvis)
      .join(name); // replace all
  });

  return dvExpr;
}
