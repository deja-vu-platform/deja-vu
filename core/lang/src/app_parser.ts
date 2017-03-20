const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

import {ClicheParser} from "./cliche_parser";
import * as _u from "underscore";
import * as _ustring from "underscore.string";


export interface Widget {
  name: string;
  fqelement: string;
}

export interface UsedClicheMap { [cliche: string]: number; }
export interface FieldMap {
  [src_field: string]: string;
}
export interface WidgetReplaceMap {
  [w_name: string]: {
    replaced_by: Widget, map: FieldMap;
  };
}
export interface ReplaceMap { [cliche: string]: WidgetReplaceMap; }
export interface App {
  fqelement: string;
  widgets: string[];
  main_widget: string;
  used_cliches: UsedClicheMap;
  used_widgets: any[];
  replace_map: ReplaceMap;
  tbonds: any[];
  fbonds: any[];
  wbonds: any[];
  data: any;
}

interface SymbolTable {
  [name: string]: StEntry;
}
interface StEntry {
  type: string;
  attr: any;
}

export class AppParser {
  private _grammar;
  private _semantics;
  private _cliche_parser;

  private _symbol_table: SymbolTable;
  private _dirname: string;

  constructor() {
    this._cliche_parser = new ClicheParser();
    const grammar_path = path.join(__dirname, "app_grammar.ohm");
    this._grammar = ohm.grammar(
        fs.readFileSync(grammar_path, "utf-8"), {
          Cliche: this._cliche_parser.grammar
        });
    this._semantics = this._grammar
      .extendSemantics(this._cliche_parser.semantics)
      .extendOperation("fqelement", {
        Decl: (app, name, key1, para, key2) => `dv-samples-${name.fqelement()}`,
        name: name => name.sourceString.toLowerCase()
      })
      // A map of id -> {type, attr}
      .extendOperation("symbolTable", {
        ClicheUsesDecl: (use, cliche, params, asDecl) => {
          const st = cliche.symbolTable();
          const alias = asDecl.symbolTable()[0];
          return {
            id: alias ? alias : st.name,
            type: "cliche",
            attr: {symbol_table: st.st, name: st.name, category: st.category}
          };
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        usedClicheName: (category, slash, name) => ({
          name: name.sourceString,
          category: category.sourceString,
          st: this
            ._cliche_parser.parse(category.sourceString, name.sourceString)
            .symbol_table
        }),
        //
        Paragraph_data: decl => decl.symbolTable(),
        Paragraph_widget: decl => decl.symbolTable(),
        Paragraph_assignment: decl => decl.symbolTable(),
        WidgetDecl: (main, widget, name, k1, fields, k2) => {
          const ret = {
            id: name.sourceString, type: "widget", attr: {
              fields: fields.symbolTable()[0],
              uses: []
            }
          };
          // Get used widgets from the HTML
          const fp = w => {
            const dashed = _ustring.dasherize(w).slice(1);
            return `${this._dirname}/src/components/${dashed}/${dashed}.html`;
          };
          const html = fs.readFileSync(fp(name.sourceString), "utf-8");
          const matches = [];
          // todo: might not have of field for app widgets
          const re = /<dv-widget\s*name="([^"]*)"\s*of="([^"]*)"[^>]*>/g;
          let match = re.exec(html);
          while (match !== null) {
            matches.push(match);
            match = re.exec(html);
          }
          ret.attr.uses = _u
            .map(matches, match => ({of: match[2], name: match[1]}));
          return ret;
        },
        AssignmentDecl: (name, colon, t_name, assign, obj) => ({
          id: name.sourceString, type: t_name.sourceString, attr: {
                value: obj.symbolTable()
              }}),
        FieldBody: (field_decl, comma, field_decls) => {
          const fields = [].concat(field_decl.symbolTable())
            .concat(_u.flatten(field_decls.symbolTable()));
          return _u
            .chain(fields)
            .flatten().reject(_u.isEmpty)
            .reduce((memo, ft) => {
              if (memo[ft.name] !== undefined) {
                throw new Error("Duplicate field" + ft.name);
              }
              memo[ft.name] = ft.t;
              return memo;
            }, {})
            .value();
        },
        //
        Obj: (cbrace1, obj_body, comma, more_obj_body, cbrace2) => _u
          .extendOwn(obj_body.symbolTable(), _u
            .chain(more_obj_body.symbolTable())
            // for some strange reason .reduce(_u.extendOwn) doesn't work
            .reduce((memo, e) => _u.extendOwn(memo, e))
            .value()),
        ObjBody: (name, colon, value) => {
          const ret = {};
          ret[name.sourceString] = value.symbolTable();
          return ret;
        },
        Value_number: (num) => Number(num.sourceString),
        Value_text: (quote1, text, quote2) => text.sourceString,
        Value_array: (sqbracket1, arr_decl, sqbracket2) => arr_decl
          .symbolTable()[0],
        ArrayDecl: (val, comma, more_val) => []
          .concat(val.symbolTable()).concat(more_val.symbolTable()),
        Value_ref: (name) => name.sourceString
      })
      .addOperation("tbonds", {
        Decl: (app, name, key1, para, key2) => _u
          .chain(para.tbonds())
          .flatten()
          .reject(_u.isEmpty)
          .reduce((memo, tbond) => {
            const st_name = tbond.subtype.name;
            if (memo[st_name] === undefined) {
              memo[st_name] = [];
            }
            memo[st_name].push(tbond.type);
            return memo;
          }, {})
          .value(),
        Paragraph_widget: decl => [], Paragraph_data: decl => [],
        Paragraph_uses: decl => decl.tbonds(), Paragraph_assignment: decl => [],
        ClicheUsesDecl: (uses, cliche, params, asDecl) => _u
          .chain(params.tbonds())
          .flatten()
          .reject(_u.isEmpty)
          .map(tinfo => {
            const alias = asDecl.tbonds()[0];
            tinfo.type.of = alias ? alias : cliche.tbonds();
            return tinfo;
          })
          .value(),
        AsDecl: (as_keyword, name) => name.sourceString,
        usedClicheName: (cat, slash, name) => name.sourceString,
        ParamsDecl: (br1, param, comma, params, br2) => []
          .concat(param.tbonds()).concat(params.tbonds()),
        ParamDecl_data: (t, colon, name) => {
          const ret = [];
          const tinfo = t.tbonds();
          if (_u.isArray(tinfo)) {
            ret.push(..._u.map(tinfo, t => ({
              subtype: {name: t},
              type: {name: name.sourceString}
            })));
          } else {
            ret.push({
              subtype: {name: tinfo},
              type: {name: name.sourceString}
            });
          }
          return ret;
        },
        ParamDecl_replaces: (n1, replaces, n2, inKeyword, n3) => [],
        Type_union: decl => decl.tbonds(), Type_array: decl => decl.tbonds(),
        Type_name: name => name.sourceString,
        UnionType: (t, bar, ts) => [t.tbonds()].concat(ts.tbonds()),
        ArrayType: (br1, t, br2) => t.tbonds()
      })
      // A map of tname -> list of values
      .addOperation("data", {
        Decl: (app, name, key1, para, key2) => _u
          .chain(para.data())
          .flatten().reject(_u.isEmpty)
          .reduce((memo, e) => {
            if (memo[e.t_name] === undefined) memo[e.t_name] = [];
            memo[e.t_name] = memo[e.t_name].concat(e.obj);
            return memo;
          }, {})
          .value(),
        Paragraph_data: decl => ({}), Paragraph_widget: decl => ({}),
        Paragraph_uses: decl => ({}), Paragraph_assignment: decl => decl.data(),
        AssignmentDecl: (name, colon, t_name, assign, obj) => {
          let obj_data = obj.data();
          if (t_name.sourceString !== "Route") {
            obj_data = _u.extendOwn({atom_id: name.sourceString}, obj_data);
          }
          return {t_name: t_name.sourceString, obj: obj_data};
        },
        Obj: (cbrace1, obj_body, comma, more_obj_body, cbrace2) => _u
          .extendOwn(obj_body.data(), _u
            .chain(more_obj_body.data())
            // for some strange reason .reduce(_u.extendOwn) doesn't work
            .reduce((memo, e) => _u.extendOwn(memo, e))
            .value()),
        ObjBody: (name, colon, value) => {
          const ret = {};
          ret[name.sourceString] = value.data();
          return ret;
        },
        Value_number: (num) => Number(num.sourceString),
        Value_text: (quote1, text, quote2) => text.sourceString,
        Value_array: (sqbracket1, arr_decl, sqbracket2) => arr_decl.data()[0],
        ArrayDecl: (val, comma, more_val) => []
          .concat(val.data()).concat(more_val.data()),
        Value_ref: (name) => {
          const ref = name.sourceString;
          const s = this._symbol_table[ref];
          if (s === undefined) {
            throw new Error("Unknown identifier " + ref);
          }
          if (s.type === "widget") {
            return ref;
          } else {
            return {atom_id: ref};
          }
        }
      })
      .addOperation("main", {
        Decl: (app, name, key1, para, key2) => _u
          .find(para.main(), m => m),
        Paragraph_data: decl => "", Paragraph_widget: decl => decl.main(),
        Paragraph_uses: decl => "", Paragraph_assignment: decl => "",
        // ohm-js bug (?)
        ClicheUsesDecl: (use, name, params, asDecl) => "",
        WidgetDecl: (m, w, n1, k1, fields, k2) => m.
          sourceString ? n1.sourceString : ""
      })
      .addOperation("usedCliches", {
        Decl: (app, name, key1, para, key2) => _u
          .countBy(_u.reject(para.usedCliches(), _u.isEmpty), k => k),
        Paragraph_data: decl => "", Paragraph_widget: decl => "",
        Paragraph_uses: decl => decl.usedCliches(),
        Paragraph_assignment: decl => "",
        ClicheUsesDecl: (uses, name, params, asDecl) => name.usedCliches(),
        usedClicheName: (category, slash, name) => {
          return `dv-${category.sourceString}-` +
            name.sourceString.toLowerCase();
        }
      })
      .addOperation("replaceMap", {
        Decl: (app, name, key1, para, key2) => {
          const rmap = _u
            .chain(para.replaceMap())
            .flatten()
            .reject(_u.isEmpty)
            .value();
          return _u.extendOwn({}, ...rmap);
        },
        Paragraph_widget: decl => [], Paragraph_data: decl => [],
        Paragraph_assignment: decl => [],
        Paragraph_uses: decl => decl.replaceMap(),
        ClicheUsesDecl: (uses, cliche, params, asDecl) => {
          const rmap = _u
            .chain(params.replaceMap())
            .flatten()
            .reject(_u.isEmpty)
            .reduce((memo, r) => {
              const r_name = {};
              r_name[r.widget] = _u.pick(r, "replaced_by");
              memo[r.in_widget] = r_name;
              return memo;
            }, {})
            .value();
          const ret = {};
          if (!_u.isEmpty(rmap)) {
            const alias = asDecl.replaceMap()[0];
            ret[alias ? alias : cliche.replaceMap()] = rmap;
          }
          return ret;
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        usedClicheName: (category, slash, name) => name.sourceString,
        ParamsDecl: (br1, param, comma, params, br2) => []
          .concat(param.replaceMap()).concat(params.replaceMap()),
        ParamDecl_data: (t, colon, name) => [],
        ParamDecl_replaces: (n1, replaces, n2, inKeyword, n3) => ({
          widget: n2.sourceString,
          in_widget: n3.sourceString,
          replaced_by: {name: n1.sourceString}
        })
      })
      .addOperation("replaceList", {
        Decl: (app, name, key1, para, key2) => _u
          .chain(para.replaceList())
          .flatten()
          .reject(_u.isEmpty)
          .value(),
        Paragraph_data: decl => ({}), Paragraph_widget: decl => ({}),
        Paragraph_uses: decl => decl.replaceList(),
        Paragraph_assignment: decl => ({}),
        ClicheUsesDecl: (uses, name, params, asDecl) => _u
          .chain(params.replaceList())
          .flatten()
          .reject(_u.isEmpty)
          .map(r => {
            r.of = name.replaceList();
            return r;
          })
          .value(),
        usedClicheName: (cat, slash, name) => name.sourceString,
        ParamsDecl: (br1, param, comma, params, br2) => []
          .concat(param.replaceList()).concat(params.replaceList()),
        ParamDecl_data: (t, colon, name) => "",
        ParamDecl_replaces: (n1, replaces, n2, inKeyword, n3) => ({
          name: n2.sourceString
        })
      });
  }

  parse(fp: string): App {
    this._dirname = path.dirname(fp);
    const dv = fs.readFileSync(fp, "utf-8");
    const r = this._grammar.match(dv);
    if (r.failed()) {
      throw new Error(r.message);
    }
    const s = this._semantics(r);
    this._symbol_table = s.symbolTable();
    console.log(JSON.stringify(this._symbol_table, null, 2));
    const app_widget_symbols = _u
      .filter(_u.values(this._symbol_table), s => s.type === "widget");
    return {
      fqelement: s.fqelement(),
      widgets: _u.pluck(app_widget_symbols, "id"),
      main_widget: s.main(),
      used_cliches: s.usedCliches(),
      used_widgets: this.used_widgets(app_widget_symbols, s.replaceList()),
      replace_map: s.replaceMap(),
      tbonds: s.tbonds(),
      fbonds: undefined, // s.fbonds(),
      wbonds: undefined, // s.wbonds(),
      data: s.data()
    };
  }

  used_widgets(widgets: any[], replace_list: Widget[]): Widget[] {
    // Widgets that are replaced
    const replaced = _u.map(replace_list, w => w.name + w.of);
    return _u
      .chain(widgets)
      .map(w => w.attr.uses)
      .flatten()
      .reject(_u.isUndefined)
      .map(cw => {
        // get all used widget of the app widgets
        // need to see what widgets the cliche widgets we use uses so that we
        // add them to the list
        const traverse = cw_name => [cw_name].concat(
          _u
            .chain(this
              ._symbol_table[cw.of].attr.symbol_table[cw_name].attr.uses)
            .reject(_u.isUndefined)
            .map(traverse)
            .flatten()
            .value());
        return [cw]
          .concat(_u
            .map(traverse(cw.name), cw_name => ({name: cw_name, of: cw.of})));
      })
      .flatten()
      // Remove replaced widgets
      // if the widget that's replaced is also used in another context it
      // will appear twice, so we want to filter it out once
      .filter(uw => {
        const replaced_index = replaced.indexOf(uw.name + uw.of);
        if (replaced_index > -1) {
          replaced.splice(replaced_index, 1);
          return false;
        }
        return true;
      })
      .uniq(uw => uw.name + uw.of)
      .value();
  }

  debug_match(fp: string) {
    const p = this.parse(fp);
    const debug = obj => JSON.stringify(obj, null, 2);

    console.log("//////////Widgets//////////");
    console.log(debug(p.widgets));
    console.log(`//////////Main widget is ${p.main_widget}//////////`);
    console.log("//////////Used Cliches//////////");
    console.log(debug(p.used_cliches));
    console.log("//////////Used Widgets//////////");
    console.log(debug(p.used_widgets));
    console.log("//////////Replace Map//////////");
    console.log(debug(p.replace_map));
    console.log("//////////tbonds//////////");
    console.log(debug(p.tbonds));
    console.log("//////////fbonds//////////");
    console.log(debug(p.fbonds));
    console.log("//////////wbonds//////////");
    console.log(debug(p.wbonds));
    console.log("//////////data//////////");
    console.log(debug(p.data));
  }
}
