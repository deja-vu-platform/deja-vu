/* tslint:disable no-magic-numbers */

import compileDvExpr, { dvToNgName, exportDvExpr } from './expression.compiler';

describe('dvToNgName', () => {
  it('should transform names properly', () => {
    expect(dvToNgName('dv.gen-int.int'))
      .toBe('dv.gen$int.int');
    expect(dvToNgName('$int'))
      .toBe('$int');
  });
});

describe('compileDvExpr', () => {
  it('should produce the correct list of names', () => {
    const dvExpr = 'foo.bar.baz.x + $qux?.quux + 2';
    const { names } = compileDvExpr(dvExpr);
    expect(names)
      .toEqual(['foo.bar.baz', '$qux']);
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

  it('should support both dv and ng comparators', () => {
    const dvExpr = '(2 > 1) && (2 gt 1)';
    const { evaluate } = compileDvExpr(dvExpr);
    const value = evaluate({});
    expect(value)
      .toBe(true);
  });
});

describe('exportDvExpr', () => {
  it('should convert comparators', () => {
    const dvdExpr = '($a>$b)&&($c<$d)&&($e>=$f)&&($g<=$h)';
    expect(exportDvExpr(dvdExpr))
      .toBe('($a gt $b)&&($c lt $d)&&($e gt= $f)&&($g lt= $h)');
  });

  it('should convert . to ?. except in names', () => {
    const dvdExpr = 'cliche.component.input.property';
    expect(exportDvExpr(dvdExpr))
      .toBe('cliche.component.input?.property');
  });
});
