const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

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
export interface Cliche {
  fqelement: string;
  widgets: string[];
}

interface SymbolTable {
  [name: string]: StEntry;
}
interface StEntry {
  type: string;
  attr: any;
}

export class Parser {
  of_name; name;
  private _grammar;
  private _semantics;

  private _symbol_table: SymbolTable;

  constructor() {
    const grammar_path = path.join(__dirname, "grammar.ohm");
    this._grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
    this._semantics = this._grammar.createSemantics()
      .addOperation("tbonds", {
        Decl: decl => decl.tbonds(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          return _u
            .chain(para.tbonds())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => [],
        Paragraph_data: decl => decl.tbonds(),
        Paragraph_assignment: decl => [],
        DataDecl: (data, name, key1, fields, key2, bond) => {
          const subtype = name.sourceString;
          return _u
            .chain(bond.tbonds())
            .reject(_u.isEmpty)
            .map(tbond => ({
              subtype: {name: subtype},
              types: _u.flatten(_u.reject(tbond, _u.isEmpty))
            }))
            .value();
        },
        DataBondDecl: (eq, data_bond, bar, data_bonds) => {
          return [data_bond.tbonds(), data_bonds.tbonds()];
        },
        DataBond: (data_bond_name, plus, data_bond_names) => {
          return [].concat(data_bond_name.tbonds())
            .concat(_u.flatten(data_bond_names.tbonds()));
        },
        dataBondName_other: (cliche, dot, name) => {
          const cliche_name = cliche.sourceString;
          if (!this._symbol_table[cliche_name]) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          return {name: name.sourceString, of: cliche_name};
        },
        dataBondName_this: name => {
          return {name: name.sourceString};
        }
      })
      .addOperation("fbonds", {
        Decl: decl => decl.fbonds(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          return _u
            .chain(para.fbonds())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => [],
        Paragraph_data: decl => decl.fbonds(),
        Paragraph_assignment: decl => [],
        DataDecl: (data, name, key1, fields, key2, bond) => {
          this.of_name = name.sourceString;
          return fields.fbonds();
        },
        FieldBody: (field_decl, comma, field_decls) => {
          return [].concat(field_decl.fbonds())
            .concat(_u.flatten(field_decls.fbonds()));
        },
        FieldDecl: (name, colon, t, field_bond_decl) => {
          const subfield = name.sourceString;
          const field_bonds = field_bond_decl.fbonds()[0];
          return _u
            .chain(field_bonds)
            .reject(_u.isEmpty)
            .map(fbond => {
              return {
                subfield: {
                  name: subfield, "of": {
                    name: this.of_name
                  },
                  "type": {
                    name: t.sourceString
                  }
                },
                fields: fbond
              };
            })
            .value();
        },
        FieldBondDecl: (eq, field_bond, bar, field_bonds) => {
          return [field_bond.fbonds(), _u.flatten(field_bonds.fbonds())];
        },
        FieldBond: (field_bond_name, plus, field_bond_names) => {
          return [].concat(field_bond_name.fbonds())
            .concat(field_bond_names.fbonds());
        },
        fieldBondName_other: (cliche, dot1, t, dot2, name) => {
          const cliche_name = cliche.sourceString;
          const cliche_info = this._symbol_table[cliche_name];
          if (!cliche_info) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          const t_info = cliche_info.attr.symbol_table[t.sourceString];
          if (!t_info) {
            throw new Error(
              `Can't find type ${t.sourceString} of ${cliche_name}` +
              ` used in ${cliche_name}.${t.sourceString}.${name.sourceString}`
            );
          }
          const ft_name = t_info.attr.fields[name.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find field ${name.sourceString} of ${t.sourceString} on ` +
              `cliche ${cliche_name}`);
          }

          return {
            name: name.sourceString, "of": {
              name: t.sourceString,
              of: cliche_name
            },
            "type": {
              name: ft_name,
              of: cliche_name
            }
          };
        },
        fieldBondName_this: (t, dot2, name) => {
          const t_info = this._symbol_table[t.sourceString];
          if (!t_info) {
            throw new Error(
              `Can't find type ${t.sourceString}` +
              ` used in ${t.sourceString}.${name.sourceString}`
            );
          }
          const ft_name = t_info.attr.fields[name.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find field ${name.sourceString} of ${t.sourceString}`);
          }

         return {
            name: name.sourceString, "of": {
              name: t.sourceString
            },
            "type": {
              name: ft_name
            }
          };
        }
      })
      .addOperation("wbonds", {
        Decl: decl => decl.wbonds(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          return _u
            .chain(para.wbonds())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => decl.wbonds(),
        Paragraph_data: decl => [],
        Paragraph_assignment: decl => [],
        WidgetDecl: (m, w, name, wU, k1, fields, k2, r) => {
          this.of_name = name.sourceString;
          return fields.fbonds();
        }
      })
      .addOperation("main", {
        Decl: decl => decl.main(),
        ClicheDecl: (cliche, name, key1, para, key2) => "",
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .find(para.main(), m => m),
        Paragraph_widget: decl => decl.main(),
        Paragraph_data: decl => "",
        Paragraph_assignment: decl => "",
        WidgetDecl: (m, w, n1, wUses, k1, fields, k2, r) => m.
          sourceString ? n1.sourceString : ""
      })
      .addOperation("usedCliches", {
        Decl: decl => decl.usedCliches(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => {
          const ret = {};
          const uses_used_cliches = uses.usedCliches()[0];
          if (uses_used_cliches !== undefined) {
            uses_used_cliches.forEach(c => {
              ret[c] = (ret[c] === undefined) ? 1 : ret[c] + 1;
            });
          }
          return ret;
        },
        ClicheUsesDecl: (uses, name1, asDecl1, comma, name2, asDecl2) => []
          .concat(name1.usedCliches()).concat(name2.usedCliches()),
        usedClicheName: (category, slash, name) => {
          return `dv-${category.sourceString}-` +
            name.sourceString.toLowerCase();
        }
      })
      .addOperation("replaceList", {
        Decl: decl => decl.replaceList(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          return _u
            .chain(para.replaceList())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => decl.replaceList(),
        Paragraph_data: decl => ({}),
        Paragraph_assignment: decl => ({}),
        WidgetDecl: (m, w, name, wUses, k1, fields, k2, r) => r.replaceList(),
        ReplacesDecl: (r, r_name, i, in_name, k1, r_map, k2) => r_name
          .replaceList(),
        replaceName: (cliche, dot, widget) => {
          return {
            name: widget.sourceString,
            of: cliche.sourceString
          };
        }
      })
      // widget that is replaced -> replacement -> w field -> replacement field
      .addOperation("replaceMap", {
        Decl: decl => decl.replaceMap(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => {
          const rmap = _u
            .chain(para.replaceMap())
            .flatten()
            .reject(_u.isEmpty)
            .value();
          return _u
            .reduce(rmap, (memo, r) => {
              const r_name = {};
              r_name[r.widget.name] = _u.pick(r, "replaced_by", "map");
              const r_in = {};
              r_in[r.in_widget.name] = r_name;
              memo[r.widget.of] = r_in;
              return memo;
            }, {});
        },
        Paragraph_widget: decl => decl.replaceMap(),
        Paragraph_data: decl => ({}),
        Paragraph_assignment: decl => ({}),
        WidgetDecl: (m, w, name, wUses, k1, fields, k2, r) => {
            this.name = name.sourceString;
            return r.replaceMap();
          },
        ReplacesDecl: (r, r_name, i, in_name, k1, r_map, k2) => {
          return {
            widget: r_name.replaceMap(),
            in_widget: in_name.replaceMap(),
            replaced_by: {
              name: this.name
            },
            map: r_map.replaceMap()[0]
          };
        },
        ReplaceMapBody: (r_map1, comma, r_map2) => _u
          .extend(
              r_map1.replaceMap(), _u.reduce(r_map2.replaceMap(), _u.extend)),
        ReplaceMap: (n1, eq, ct2, dot2, n2) => {
          const ret = {};
          ret[n2.sourceString] = {
            "type": {
              "name": this._symbol_table[ct2.sourceString]
                  .attr.fields[n2.sourceString]
            },
            "maps_to": n1.sourceString
          };
          return ret;
        },
        replaceName: (cliche, dot, widget) => {
          return {
            name: widget.sourceString,
            of: cliche.sourceString
          };
        }
      })
      .addOperation("isApp", {
        Decl: decl => decl.isApp(),
        AppDecl: (app, name, uses, key1, para, key2) => true,
        ClicheDecl: (cliche, name, key1, para, key2) => false
      })
      .addOperation("fqelement", {
        Decl: decl => decl.fqelement(),
        AppDecl: (app, name, uses, key1, para, key2) => {
          return `dv-samples-${name.fqelement()}`;
        },
        ClicheDecl: (cliche, name, key1, para, key2) => {
          // todo
          return name.fqelement();
        },
        name: name => name.sourceString.toLowerCase()
      })
      // A map of id -> {type, attr}
      .addOperation("symbolTable", {
        Decl: decl => _u
          .reduce(decl.symbolTable(), (memo, s) => {
            memo[s.id] = s;
            return memo;
          }, {}),
        ClicheDecl: (cliche, name, key1, para, key2) => para.symbolTable(),
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .map(para.symbolTable(), s => {
            if (s.type === "widget") {
              // Get used widgets from the HTML
              const fp = w => {
                const dashed = _ustring.dasherize(w).slice(1);
                return `../src/components/${dashed}/${dashed}.html`;
              };
              const html = fs.readFileSync(fp(s.id), "utf-8");
              const ret = [];
              // todo: might not have of field for app widgets
              const re = /<dv-widget\s*name="([^"]*)"\s*of="([^"]*)"[^>]*>/g;
              let match = re.exec(html);
              while (match !== null) {
                ret.push(match);
                match = re.exec(html);
              }
              s.attr.uses = _u
                .map(ret, match => ({of: match[2], name: match[1]}));
            }
            return s;
          })
          .concat(uses.symbolTable()[0]),
        ClicheUsesDecl: (uses, name1, asDecl1, comma, name2, asDecl2) => {
          const st1 = name1.symbolTable();
          const as1 = asDecl1.symbolTable()[0];
          const cliche_symbol1 = {
            id: as1 ? as1 : st1.name,
            type: "cliche",
            attr: {symbol_table: st1.st, name: st1.name, category: st1.category}
          };
          return []
            .concat(cliche_symbol1)
            .concat(_u
              .map(_u
                .zip(asDecl2.symbolTable(), name2.symbolTable()),
                s => ({
                  id: s[0][0] ? s[0][0] : s[1].name,
                  type: "cliche",
                  attr: {
                    symbol_table: s[1].st,
                    name: s[1].name,
                    category: s[1].category
                  }
                }))
            );
        },
        AsDecl: (as_keyword, name) => name.sourceString,
        usedClicheName: (category, slash, name) => ({
          name: name.sourceString,
          category: category.sourceString,
          st: this
            ._parse_cliche(category.sourceString, name.sourceString)
            .symbolTable()
        }),
        //
        Paragraph_data: decl => decl.symbolTable(),
        Paragraph_widget: decl => decl.symbolTable(),
        Paragraph_assignment: decl => decl.symbolTable(),
        DataDecl: (data, name, k1, fields, k2, bonds) => ({
          id: name.sourceString, type: "data", attr: {
                fields: fields.symbolTable()[0]
              }}),
        WidgetDecl: (main, widget, name, uses, k1, fields, k2, replace) => ({
          id: name.sourceString, type: "widget", attr: {
                fields: fields.symbolTable()[0],
                uses: uses.symbolTable()[0]
              }}),
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
        WidgetUsesDecl: (u, used_widget, comma, used_widgets) => []
          .concat(used_widget.symbolTable())
          .concat(used_widgets.symbolTable()),
        name: (name) => name.sourceString,
        //
        FieldDecl: (name, colon, t, field_bond_decl) => {
          return {name: name.sourceString, t: t.sourceString};
        },
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
      // A map of tname -> list of values
      .addOperation("data", {
        Decl: decl => decl.data(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .chain(para.data())
          .flatten().reject(_u.isEmpty)
          .reduce((memo, e) => {
            if (memo[e.t_name] === undefined) memo[e.t_name] = [];
            memo[e.t_name] = memo[e.t_name].concat(e.obj);
            return memo;
          }, {})
          .value(),
        Paragraph_data: decl => ({}), Paragraph_widget: decl => ({}),
        Paragraph_assignment: decl => decl.data(),
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
        ArrayDecl: (val, comma, more_val) => {
          console.log("y" + JSON.stringify(more_val.data()));
          return [].concat(val.data()).concat(more_val.data());
        },
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
      });
  }

  parse(fp: string): (App | Cliche) {
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
    if (s.isApp()) {
      return {
        fqelement: s.fqelement(),
        widgets: _u.pluck(app_widget_symbols, "id"),
        main_widget: s.main(),
        used_cliches: s.usedCliches(),
        used_widgets: this.used_widgets(app_widget_symbols, s.replaceList()),
        replace_map: s.replaceMap(),
        tbonds: s.tbonds(),
        fbonds: s.fbonds(),
        wbonds: s.wbonds(),
        data: s.data()
      };
    } else {
      return {
        fqelement: s.fqelement(),
        widgets: _u.pluck(app_widget_symbols, "id")
      };
    }
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

  isApp(parseObj: App | Cliche): parseObj is App {
    return (<App>parseObj).data !== undefined;
  }

  debug_match(fp: string) {
    const p = this.parse(fp);
    const debug = obj => JSON.stringify(obj, null, 2);

    if (this.isApp(p)) {
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
    } else {
      console.log("//////////Widgets//////////");
      console.log(debug(p.widgets));
    }
  }

  private _parse_cliche_internal(fp: string) {
    const dv = fs.readFileSync(fp, "utf-8");
    const r = this._grammar.match(dv);
    if (r.failed()) {
      throw new Error(r.message);
    }
    return this._semantics(r);
  }

  private _parse_cliche(category, name) {
    return new Parser()
      ._parse_cliche_internal(`../../catalog/${category}/${name}/${name}.dv`);
  }
}
