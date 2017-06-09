const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

import * as _u from "underscore";


export interface SymbolTable {
  [name: string]: StEntry;
}
export interface StEntry {
  type: string;
  attr: any;
}

export interface Cliche {
  fqelement: string;
  widgets: string[];
  symbol_table: SymbolTable;
  wfbonds: any[];
}


export class ClicheParser {
  grammar;
  semantics;

  private _symbol_table: SymbolTable;

  constructor() {
    const grammar_path = path.join(__dirname, "cliche_grammar.ohm");
    this.grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
    this.semantics = this.grammar.createSemantics()
      .addOperation("fqelement", {
        Decl: (cliche, name, key1, para, key2) => name.sourceString
      })
      // A map of id -> {type, attr}
      .addOperation("symbolTable", {
        Decl: (cliche, name, key1, para, key2) => _u
          .reduce(para.symbolTable(), (memo, s) => {
            memo[s.id] = s;
            return memo;
          }, {}),
        Paragraph_data: decl => decl.symbolTable(),
        Paragraph_widget: decl => decl.symbolTable(),
        DataDecl: (data, name, k1, fields, k2) => ({
          id: name.sourceString, type: "data", attr: {
                fields: fields.symbolTable()[0]
              }}),
        WidgetDecl: (widget, name, uses, k1, fields, k2) => ({
          id: name.sourceString, type: "widget", attr: {
                fields: fields.symbolTable()[0],
                uses: uses.symbolTable()[0]
              }}),
        FieldBody: (field_decl, comma, field_decls) => {
          const fields = [].concat(field_decl.symbolTable())
            .concat(_u.flatten(field_decls.symbolTable()));
          return _u
            .chain(fields)
            .flatten().reject(_u.isEmpty)
            .reduce((memo, ft) => {
              if (memo[ft.id] !== undefined) {
                throw new Error("Duplicate field" + ft.id);
              }
              memo[ft.id] = ft;
              return memo;
            }, {})
            .value();
        },
        Uses: (u, used_widget, comma, used_widgets) => []
          .concat(used_widget.symbolTable())
          .concat(used_widgets.symbolTable()),
        name: (name) => name.sourceString,
        FieldDecl: (name, colon, t_name) => ({
          id: name.sourceString, type: t_name.sourceString
        })
      });
  }

  parse(category, name): Cliche {
    return this.parse_fp(`../../catalog/${category}/${name}/${name}.dv`);
  }

  parse_fp(fp: string): Cliche {
    const dv = fs.readFileSync(fp, "utf-8");
    const r = this.grammar.match(dv);
    if (r.failed()) {
      throw new Error(r.message);
    }
    const s = this.semantics(r);
    this._symbol_table = s.symbolTable();
    const fqelement = s.fqelement();
    return {
      fqelement: s.fqelement(),
      widgets: _u
        .chain(_u.values(this._symbol_table))
        .filter(s => s.type === "widget")
        .pluck("id")
        .value(),
      symbol_table: this._symbol_table,
      wfbonds: this._wfbonds(fqelement)
    };
  }

  debug_match(fp: string) {
    const p = this.parse_fp(fp);
    const debug = obj => JSON.stringify(obj, null, 2);

    console.log("//////////Widgets//////////");
    console.log(debug(p.widgets));
  }

  _match(ftname: string, matcht: string, fqelement: string) {
    let ret = {};

    const t_st = this._symbol_table[matcht];
    if (t_st === undefined) throw new Error(`Can't find type ${matcht}`);

    const fname = _u.findKey(t_st.attr.fields, ft => ft === ftname);
    if (fname !== undefined) {
      ret = {
        name: fname, of: {name: matcht, fqelement: fqelement},
        type: {name: t_st.attr.fields[fname], fqelement: fqelement}
      };
    }
    return ret;
  }

  _wfbonds(fqelement) {
    return _u
      .chain(_u.values(this._symbol_table))
      .filter(s => s.type === "widget")
      .map(data => _u
        .map(data.attr.fields, (subftype, subfname) => _u
          .map(subftype.split("|"), subft => ({
            subfield: {
              name: subfname, of: {name: data.id, fqelement: fqelement},
              type: {name: subftype, fqelement: fqelement}},
            fields: _u
              .reject(_u
                .map(this._symbol_table[data.id].attr.uses,
                     matcht => this._match(subft.trim(), matcht, fqelement)),
                _u.isEmpty)
          }))))
      .flatten()
      .reject(b => _u.isEmpty(b.fields))
      .value();
  }
}
