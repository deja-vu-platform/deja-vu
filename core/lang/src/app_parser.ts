const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

import {ClicheParser, SymbolTable} from "./cliche_parser";
import * as _u from "underscore";
import * as _ustring from "underscore.string";


export interface Widget {
  name: string;
  fqelement: string;
}

export interface UsedClicheMap { [fqelement: string]: string; }
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
  dfbonds: any[];
  wfbonds: any[];
  data: any;
}


export class AppParser {
  BASIC_TYPES = ["Text", "Boolean", "Date", "Datetime", "Number"];
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
      .addOperation("fqelement", {
        Decl: (app, name, key1, para, key2) => name.fqelement(),
        name: name => name.sourceString
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
          const re = /<dv-widget\s*name="([^"]*)"\s*(of="([^"]*)")?[^>]*>/g;
          let match = re.exec(html);
          while (match !== null) {
            matches.push(match);
            match = re.exec(html);
          }
          ret.attr.uses = _u
            .map(matches, match => {
              if (match[2] === undefined) {
                return match[1];
              } else {
                return {fqelement: match[3], name: match[1]};
              }
            });
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
            tinfo.type.fqelement = alias ? alias : cliche.tbonds();
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
      // a map fqelement -> cliche
      .addOperation("usedCliches", {
        Decl: (app, name, key1, para, key2) => _u
          .reduce(_u.reject(para.usedCliches(), _u.isEmpty),
                  (memo, uc) => {
                    memo[uc.fqelement] = uc.cliche;
                    return memo;
                  }, {}),
        Paragraph_data: decl => "", Paragraph_widget: decl => "",
        Paragraph_uses: decl => decl.usedCliches(),
        Paragraph_assignment: decl => "",
        ClicheUsesDecl: (uses, name, params, asDecl) => {
          const alias = asDecl.usedCliches()[0];
          const cliche = name.usedCliches();
          return {
            fqelement: alias ? alias : cliche.name,
            cliche: `dv-${cliche.category}-${cliche.name.toLowerCase()}`
          };
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        usedClicheName: (category, slash, name) => ({
          category: category.sourceString, name: name.sourceString
        })
      })
      .addOperation("replaceMap", {
        Decl: (app, name, key1, para, key2) => {
          const rmap = _u
            .chain(para.replaceMap())
            .flatten()
            .reject(_u.isEmpty)
            .value();
          return _u
            .mapObject(_u.extendOwn({}, ...rmap), (widget, cliche) => _u
              .mapObject(widget, (widget, parent_widget) => _u
                .mapObject(widget, (rinfo, widget) => {
                  rinfo.replaced_by.fqelement = name.sourceString;
                  return rinfo;
                })));
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
            r.fqelement = name.replaceList();
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
    const tbonds = s.tbonds();
    const fqelement = s.fqelement();
    return {
      fqelement: fqelement,
      widgets: _u.pluck(app_widget_symbols, "id"),
      main_widget: s.main(),
      used_cliches: s.usedCliches(),
      used_widgets: this.used_widgets(app_widget_symbols, s.replaceList()),
      replace_map: this._fmaps(s.replaceMap(), tbonds, fqelement),
      tbonds: this._tbonds(tbonds, fqelement),
      dfbonds: this._dfbonds(tbonds, fqelement),
      wfbonds: this._wfbonds(tbonds, fqelement),
      data: s.data()
    };
  }

  _tbonds(tbonds, fqelement: string) {
    return _u.values(_u.mapObject(tbonds, (types, subtname) => ({
      subtype: {name: subtname, fqelement: fqelement}, types: types
    })));
  }

  _fmaps(rmap, tbonds, fqelement) {
    return _u
      .mapObject(rmap, (widget, cliche) => _u
        .mapObject(widget, (widget, parent_widget) => _u
          .mapObject(widget, (rinfo, widget) => {
            rinfo.map = _u
              .chain(this._symbol_table[rinfo.replaced_by.name].attr.fields)
              .map((subftype, subfname) => {
                const finfo = _u.reject(_u
                  .map(subftype.split("|"), subft => this
                    ._match(
                      subft.trim(), {name: widget, fqelement: cliche}, tbonds,
                      fqelement)),
                  _u.isEmpty);
                let ret = {};
                if (finfo.length > 1) {
                  throw new Error(`TBD ${JSON.stringify(finfo)}`);
                } else if (finfo.length === 1) {
                  ret = {
                    name: subfname,
                    type: {name: subftype, fqelement: fqelement},
                    maps_to: finfo[0].name
                  };
                }
                return ret;
              })
              .reject(_u.isEmpty)
              .reduce((memo, {name, type, maps_to}) => {
                memo[name] = {type: type, maps_to: maps_to};
                return memo;
              }, {})
              .value();
            return rinfo;
          })));
  }

  _dfbonds(tbonds, fqelement) {
    return this._fbonds("data", subfof => tbonds[subfof], tbonds, fqelement);
  }

  _wfbonds(tbonds, fqelement) {
    return this._fbonds(
      "widget", subfof => this
        ._symbol_table[subfof].attr.uses, tbonds, fqelement);
  }

  // t is the type of the field
  // matchts is a list record types to use to look for a field that has as a
  // type one that matches t
  _match(t: string, matcht, tbonds, fqelement: string) {
    const is_subtype = (t1: string, t2: {name: string, fqelement: string}) => (
      (this.BASIC_TYPES.indexOf(t1) > -1 && t2.name === t1) ||
      !!_u.find(tbonds[t1], b => b.name === t2.name &&
                b.fqelement === t2.fqelement)
    );
    let ret = {};
    if (matcht.fqelement === undefined) {  // is an app t
      const t_st = this._symbol_table[matcht];
      if (t_st === undefined) throw new Error(`Can't find type ${matcht}`);
      const fname =  _u.findKey(t_st.attr.fields, ft => ft === t);
      if (fname !== undefined) {
        ret = {
          name: fname, of: {name: matcht, fqelement: fqelement},
          type: {name: t_st.attr.fields[fname], fqelement: fqelement}
        };
      }
    } else {
      const t_st = this
        ._symbol_table[matcht.fqelement].attr.symbol_table[matcht.name];
      if (t_st === undefined) {
        throw new Error(
          `Can't find type ${matcht.name} of ${matcht.fqelement}`);
      }
      const fname =  _u
        .findKey(t_st.attr.fields,
                 ft => is_subtype(t, {name: ft, fqelement: matcht.fqelement}));
      if (fname !== undefined) {
        ret = {
          name: fname, of: {name: matcht.name, fqelement: matcht.fqelement},
          type: {name: t_st.attr.fields[fname], fqelement: matcht.fqelement}
        };
      }
    }
    return ret;
  }

  _fbonds(t, matchts_fn, tbonds, fqelement) {
    return _u
      .chain(_u.values(this._symbol_table))
      .filter(s => s.type === t)
      .map(data => _u
        .map(data.attr.fields, (subftype, subfname) => _u
          .map(subftype.split("|"), subft => ({
            subfield: {
              name: subfname, of: {name: data.id, fqelement: fqelement},
              type: {name: subftype, fqelement: fqelement}},
            fields: _u
              .reject(_u
                .map(matchts_fn(data.id),
                     matcht => this
                       ._match(subft.trim(), matcht, tbonds, fqelement)),
                _u.isEmpty)
          }))))
      .flatten()
      .value();
  }

  used_widgets(widgets: any[], replace_list: Widget[]): Widget[] {
    // Widgets that are replaced
    const replaced = _u.map(replace_list, w => w.name + w.fqelement);
    return _u
      .chain(widgets)
      .map(w => w.attr.uses)
      .flatten()
      .reject(_u.isUndefined)
      .reject(w => w.fqelement === undefined) // reject app widgets
      .map(cw => {
        // get all used widget of the app widgets
        // need to see what widgets the cliche widgets we use uses so that we
        // add them to the list
        const traverse = cw_name => {
          const cliche_st = this._symbol_table[cw.fqelement];
          if (cliche_st === undefined) {
            throw new Error(`Can't find cliche ${cw.fqelement}`);
          }
          const widget_ste = cliche_st.attr.symbol_table[cw_name];
          if (widget_ste === undefined) {
            throw new Error(
              `Can't find widget ${cw_name} of cliche ${cw.fqelement}`);
          }
          return [cw_name].concat(_u
            .chain(widget_ste.attr.uses)
            .reject(_u.isUndefined)
            .map(traverse)
            .flatten()
            .value());
        };
        cw.cliche = this._symbol_table[cw.fqelement].attr.name;
        return [cw]
          .concat(_u
            .map(traverse(cw.name), cw_name => ({
              name: cw_name, fqelement: cw.fqelement, cliche: cw.cliche
            })));
      })
      .flatten()
      // Remove replaced widgets
      // if the widget that's replaced is also used in another context it
      // will appear twice, so we want to filter it out once
      .filter(uw => {
        const replaced_index = replaced.indexOf(uw.name + uw.fqelement);
        if (replaced_index > -1) {
          replaced.splice(replaced_index, 1);
          return false;
        }
        return true;
      })
      .uniq(uw => uw.name + uw.fqelement)
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
    console.log("//////////dfbonds//////////");
    console.log(debug(p.dfbonds));
    console.log("//////////wfbonds//////////");
    console.log(debug(p.wfbonds));
    console.log("//////////data//////////");
    console.log(debug(p.data));
  }
}
