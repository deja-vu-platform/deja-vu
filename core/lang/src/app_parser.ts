const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

import {ClicheParser, SymbolTable, StEntry} from "./cliche_parser";
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
  nfbonds: any[];
  data: any;
}


export class AppParser {
  PRIMITIVE_TYPES = [
    "text", "boolean", "number", "date", "datetime", "time", "widget"];
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
        Decl: (app, name, key1, para, key2) => name.fqelement(),
        name: name => name.sourceString
      })
      // A map of id -> {type, attr}
      .extendOperation("symbolTable", {
        IncludeDecl: (use, cliche, params, asDecl) => {
          const st = cliche.symbolTable();
          const alias = asDecl.symbolTable()[0];
          return {
            id: alias ? alias : st.name,
            type: "cliche",
            attr: {
              symbol_table: st.st, name: st.name, category: st.category,
              wfbonds: st.wfbonds
            }
          };
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        clicheName: (category, slash, name) => {
          const cliche = this
            ._cliche_parser.parse(category.sourceString, name.sourceString);
          return {
            name: name.sourceString,
            category: category.sourceString,
            st: cliche.symbol_table,
            wfbonds: cliche.wfbonds
          };
        },
        //
        Paragraph_data: decl => decl.symbolTable(),
        Paragraph_widget: decl => decl.symbolTable(),
        Paragraph_field: decl => decl.symbolTable(),
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
        FieldDecl: (name, colon, t_name, assign, value) => ({
          id: name.sourceString, type: t_name.sourceString, attr: {
                value: value.symbolTable()[0]
              }}),
        //
        Value_number: num => Number(num.sourceString),
        Value_obj: obj => obj.symbolTable(),
        Value_text: (quote1, text, quote2) => text.sourceString,
        Value_array: (sqbracket1, arr_decl, sqbracket2) => arr_decl
          .symbolTable()[0],
        Value_ref: name => name.sourceString,

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
        ArrayDecl: (val, comma, more_val) => []
          .concat(val.symbolTable()).concat(more_val.symbolTable())
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
        Paragraph_include: decl => decl.tbonds(), Paragraph_field: decl => [],
        IncludeDecl: (uses, cliche, params, asDecl) => _u
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
        clicheName: (cat, slash, name) => name.sourceString,
        Params: (br1, param, comma, params, br2) => []
          .concat(param.tbonds()).concat(params.tbonds()),
        Param_data: (t, for_keyword, name) => {
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
        Param_replaces: (n1, replaces, n2, inKeyword, n3) => [],
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
            memo[e.t_name] = memo[e.t_name].concat(e.value);
            return memo;
          }, {})
          .value(),
        Paragraph_data: decl => ({}), Paragraph_widget: decl => ({}),
        Paragraph_include: decl => ({}), Paragraph_field: decl => decl.data(),
        FieldDecl: (name, colon, t_name, assign, value) => {
          let value_data = value.data()[0];
          if (t_name.sourceString !== "Route") {
            value_data = _u.extendOwn({atom_id: name.sourceString}, value_data);
          }
          return {t_name: t_name.sourceString, value: value_data};
        },

        Value_number: (num) => Number(num.sourceString),
        Value_text: (quote1, text, quote2) => text.sourceString,
        Value_array: (sqbracket1, arr_decl, sqbracket2) => arr_decl.data()[0],
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
        ArrayDecl: (val, comma, more_val) => []
          .concat(val.data()).concat(more_val.data())
      })
      .addOperation("main", {
        Decl: (app, name, key1, para, key2) => _u
          .find(para.main(), m => m),
        Paragraph_data: decl => "", Paragraph_widget: decl => decl.main(),
        Paragraph_include: decl => "", Paragraph_field: decl => "",
        // ohm-js bug (?)
        IncludeDecl: (use, name, params, asDecl) => "",
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
        Paragraph_include: decl => decl.usedCliches(),
        Paragraph_field: decl => "",
        IncludeDecl: (uses, name, params, asDecl) => {
          const alias = asDecl.usedCliches()[0];
          const cliche = name.usedCliches();
          return {
            fqelement: alias ? alias : cliche.name,
            cliche: `dv-${cliche.category}-${cliche.name.toLowerCase()}`
          };
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        clicheName: (category, slash, name) => ({
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
        Paragraph_field: decl => [],
        Paragraph_include: decl => decl.replaceMap(),
        IncludeDecl: (uses, cliche, params, asDecl) => {
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
        clicheName: (category, slash, name) => name.sourceString,
        Params: (br1, param, comma, params, br2) => []
          .concat(param.replaceMap()).concat(params.replaceMap()),
        Param_data: (t, for_keyword, name) => [],
        Param_replaces: (n1, replaces, n2, inKeyword, n3) => ({
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
        Paragraph_include: decl => decl.replaceList(),
        Paragraph_field: decl => ({}),
        IncludeDecl: (uses, name, params, asDecl) => _u
          .chain(params.replaceList())
          .flatten()
          .reject(_u.isEmpty)
          .map(r => {
            r.fqelement = name.replaceList();
            return r;
          })
          .value(),
        clicheName: (cat, slash, name) => name.sourceString,
        Params: (br1, param, comma, params, br2) => []
          .concat(param.replaceList()).concat(params.replaceList()),
        Param_data: (t, for_keyword, name) => "",
        Param_replaces: (n1, replaces, n2, inKeyword, n3) => ({
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
      wfbonds: this._wfbonds(tbonds, fqelement).concat(this._cliche_wfbonds()),
      nfbonds: this._nfbonds(tbonds, fqelement),
      data: s.data()
    };
  }

  _cliche_wfbonds() {
    return _u
      .chain(_u.values(this._symbol_table))
      .filter(s => s.type === "cliche")
      .reject(s => _u.isEmpty(s.attr.wfbonds))
      .map(cliche => _u.map(cliche.attr.wfbonds, wfbond => {
        wfbond.subfield.of.fqelement = cliche.id;
        wfbond.subfield.type.fqelement = cliche.id;
        const mapped_fields = _u.map(wfbond.fields, f => {
          f.of.fqelement = cliche.id;
          f.of.type = cliche.id;
          delete f.of.type;
          return f;
        });
        wfbond.fields = mapped_fields;
        return wfbond;
      }))
      .flatten()
      .value();
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
              .map((subf, subfname) => {
                const finfo = _u.reject(_u
                  .map(subf.type.split("|"), subft => this
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
                    type: {name: subf.type, fqelement: fqelement},
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
    return this._fbonds(
      ste => ste.type === "data",
      subfof => tbonds[subfof], tbonds, fqelement);
  }

  _wfbonds(tbonds, fqelement) {
    return this._fbonds(
      ste => ste.type === "widget",
      subfof => this._symbol_table[subfof].attr.uses,
      tbonds,
      fqelement);
  }

  _nfbonds(tbonds, fqelement) {
    return this._fbonds(
      // Only look at widget entries that have a field of type widget (since
      // they are the only widgets that can cause a navigation)
      ste => ste.type === "widget" &&
             _u.contains(_u.values(ste.attr.fields), "Widget"),
      // Match the original widget with the target widget (that is determined
      // by the value of the field of type widget)
      subfof => {
        const to_widget_fname = _u
          .findKey(this._symbol_table[subfof].attr.fields, t => t === "Widget");
        const w = _u.findWhere(_u.values(this._symbol_table), {type: subfof});
        const ret = w.attr.value[to_widget_fname];
        if (ret === undefined) {
          throw new Error(`No widget provided for navigation in ${subfof}`);
        }
        return [ret];
      },
      tbonds,
      fqelement);
  }

  _match(t: string, matcht, tbonds, fqelement: string) {
    const is_subtype = (t1: string, t2: {name: string, fqelement: string}) => (
      (this.PRIMITIVE_TYPES.indexOf(t1) > -1 && t2.name === t1) ||
      !!_u.find(tbonds[t1], b => b.name === t2.name &&
                b.fqelement === t2.fqelement)
    );
    let ret = {};
    if (matcht.fqelement === undefined) {  // is an app t
      const t_st = this._symbol_table[matcht];
      if (t_st === undefined) throw new Error(`Can't find type ${matcht}`);
      const fname =  _u.findKey(t_st.attr.fields, f => f.type === t);
      if (fname !== undefined) {
        ret = {
          name: fname, of: {name: matcht, fqelement: fqelement},
          type: {name: t_st.attr.fields[fname].type, fqelement: fqelement}
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
                 f => is_subtype(t,
                   {name: f.type, fqelement: matcht.fqelement}));
      if (fname !== undefined) {
        ret = {
          name: fname, of: {name: matcht.name, fqelement: matcht.fqelement},
          type: {
            name: t_st.attr.fields[fname].type, fqelement: matcht.fqelement}
        };
      }
    }
    return ret;
  }

  _fbonds(ste_filter: (s: StEntry) => boolean, matchts_fn, tbonds, fqelement) {
    return _u
      .chain(_u.values(this._symbol_table))
      .filter(s => s.type === t)
      .map(data => {
        const matchts = matchts_fn(data.id);
        return _u
          .map(data.attr.fields, (subftype, subfname) => _u
            .map(subftype.split("|"), subft => ({
              subfield: {
                name: subfname, of: {name: data.id, fqelement: fqelement},
                type: {name: subftype, fqelement: fqelement}},
              fields: _u
                .reject(_u
                  .map(matchts, matcht => this
                       ._match(subft.trim(), matcht, tbonds, fqelement)),
                  _u.isEmpty)
            })));
      })
      .flatten()
      .reject(b => _u.isEmpty(b.fields))
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
        if (this._symbol_table[cw.fqelement] === undefined) {
            throw new Error(`Can't find cliche ${cw.fqelement}`);
        }
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
    console.log("//////////nfbonds//////////");
    console.log(debug(p.nfbonds));
    console.log("//////////data//////////");
    console.log(debug(p.data));
  }
}
