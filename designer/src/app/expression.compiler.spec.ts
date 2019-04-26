/* tslint:disable no-magic-numbers */

import compileDvExpr, { dvToNgName } from './expression.compiler';

describe('dvToNgName', () => {
  it('should transform names properly', () => {
    expect(dvToNgName('dv.gen-int.int'))
      .toEqual('dv.gen$int.int');
    expect(dvToNgName('$int'))
      .toEqual('$int');
  });
});

describe('compileDvExpr', () => {
  it('should produce the correct list of names', () => {
    const dvExpr = 'dv.gen-int.int + $int + 1';
    const { names } = compileDvExpr(dvExpr);
    expect(names)
      .toEqual(['dv.gen-int.int', '$int']);
  });

  it('should produce the correct value', () => {
    const dvExpr = 'dv.gen-int.int + $int + 1';
    const { evaluate } = compileDvExpr(dvExpr);
    const value = evaluate({
      dv: {
        gen$int: {
          int: 4
        }
      },
      $int: 3
    });
    expect(value)
      .toBe(8);
  });
});
