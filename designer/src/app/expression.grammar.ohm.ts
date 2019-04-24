/**
 * should be consistent with
 *   `@deja-vu/packages/compiler/src/action/action.grammar.ohm`
 * @todo figure out how to just import .ohm as a string
 *
 * **Changes:**
 * - I added navname because by default ohm was grouping (nav name)+ weird
 */

export default String.raw`
Expression {
  // Exprs
  Expr
    = UnExpr       -- un
    | BinExpr      -- bin
    | TerExpr      -- ter
    | MemberExpr   -- member
    | Literal      -- literal
    | input        -- input
    | "(" Expr ")" -- parens

  UnExpr
    = "!" Expr -- not

  BinExpr
    = Expr "+" Expr   -- plus
    | Expr "-" Expr   -- minus
    | Expr "*" Expr   -- mul
    | Expr "/" Expr   -- div
    | Expr "%" Expr   -- mod
    // Relational Expr
    | Expr "lt" Expr -- lt
    | Expr "gt" Expr -- gt
    | Expr "lt=" Expr -- le
    | Expr "gt=" Expr -- ge
    // Equality Expr
    | Expr "===" Expr -- eq
    | Expr "!==" Expr -- neq
    // Logical Expr
    | Expr "&&" Expr  -- and
    | Expr "||" Expr  -- or

  TerExpr = Expr "?" Expr ":" Expr

  MemberExpr = (name | input) navname+

  Literal
    = decimalLiteral            -- number
    | stringLiteral             -- text
    | "true"                    -- true
    | "false"                   -- false
    | ObjectLiteral             -- obj
    | "[" ListOf<Expr, ","> "]" -- array

  ObjectLiteral
    = "{" ListOf<PropAssignment, ","> "}"             -- noTrailingComma
    | "{" NonemptyListOf<PropAssignment, ","> "," "}" -- trailingComma

  decimalLiteral
    = signedInt "." decimalDigit* exponentPart -- bothParts
    |           "." decimalDigit+ exponentPart -- decimalsOnly
    | signedInt                   exponentPart -- integerOnly

  signedInt
    = "+" decimalIntLiteral* -- positive
    | "-" decimalIntLiteral* -- negative
    | decimalIntLiteral+     -- noSign
  decimalIntLiteral
    = nonZeroDigit decimalDigit*  -- nonZero
    | "0"                         -- zero
  decimalDigit = "0".."9"
  nonZeroDigit = "1".."9"

  exponentPart
    = exponentIndicator signedInt -- present
    |                             -- absent
  exponentIndicator = "e" | "E"

  stringLiteral
    = "\"" doubleStringChar* "\"" -- doubleQuote
    | "'" singleStringChar* "'"   -- singleQuote
  doubleStringChar = ~("\"") any
  singleStringChar = ~("'") any

  PropAssignment = name ":" Expr

  number = "-"? digit+
  name = letter (alnum | "-" | "_")*
  input = "$" name
  output = name "$"

  nav = "." | "?."
  navname = nav name
  space := whitespace
  whitespace = "\t"
             | "\x0B"    -- verticalTab
             | "\x0C"    -- formFeed
             | " "
             | "\u00A0"  -- noBreakSpace
             | "\uFEFF"  -- byteOrderMark
             | unicodeSpaceSeparator
  unicodeSpaceSeparator = "\u2000".."\u200B" | "\u3000"
}
`;
