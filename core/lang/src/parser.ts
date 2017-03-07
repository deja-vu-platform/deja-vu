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
export interface ClicheMap {
  [alias: string]: {fqelement: string, name: string};
}
export interface FieldType { [f_name: string]: string; }
export interface FieldTypesMap { [of_name: string]: FieldType; }
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
  used_cliches: UsedClicheMap;
  cliche_map: ClicheMap;
  ft_map: FieldMap;
  replace_map: ReplaceMap;
  uft_map: any;
  used_widgets: any[];
  main_widget: string;
  widgets: string[];
  tbonds: any[];
  fbonds: any[];
  wbonds: any[];
  data: any;
}
export interface Cliche {
  fqelement: string;
  widgets: string[];
}

export class Parser {
  of_name; name;
  private _grammar;
  private _semantics;

  // Some auxiliary structures
  private _symbol_table;
  private _cliche_map;
  private _ft_map;
  private _this_ft_map;

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
          const mapped_cliche = this._cliche_map["this"];
          return _u
            .chain(bond.tbonds())
            .reject(_u.isEmpty)
            .map(tbond => ({
              subtype: {
                name: subtype, fqelement: mapped_cliche.fqelement
              },
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
          const mapped_cliche = this._cliche_map[cliche_name];
          if (!mapped_cliche) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          return {name: name.sourceString, fqelement: mapped_cliche.fqelement};
        },
        dataBondName_this: name => {
          const mapped_cliche = this._cliche_map["this"];
          return {name: name.sourceString, fqelement: mapped_cliche.fqelement};
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
          const mapped_cliche = this._cliche_map["this"];
          const field_bonds = field_bond_decl.fbonds()[0];
          return _u
            .chain(field_bonds)
            .reject(_u.isEmpty)
            .map(fbond => {
              return {
                subfield: {
                  name: subfield, "of": {
                    name: this.of_name, fqelement: mapped_cliche.fqelement
                  },
                  "type": {
                    name: t.sourceString, fqelement: mapped_cliche.fqelement
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
          const mapped_cliche = this._cliche_map[cliche_name];
          if (!mapped_cliche) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          let ft_key = mapped_cliche.fqelement;
          if (ft_key.split("-").length === 4) ft_key = ft_key.slice(0, -2);
          let ft_name = this._ft_map[ft_key][t.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find type ${t.sourceString} of ${cliche_name}` +
              ` used in ${cliche_name}.${t.sourceString}.${name.sourceString}`
            );
          }
          ft_name = ft_name[name.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find field ${name.sourceString} of ${t.sourceString} on ` +
              `cliche ${cliche_name}`);
          }

          return {
            name: name.sourceString, "of": {
              name: t.sourceString,
              fqelement: mapped_cliche.fqelement
            },
            "type": {
              name: ft_name,
              fqelement: mapped_cliche.fqelement
            }
          };
        },
        fieldBondName_this: (t, dot2, name) => {
          const mapped_cliche = this._cliche_map["this"];

          let ft_name = this._this_ft_map[t.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find type ${t.sourceString}` +
              ` used in ${t.sourceString}.${name.sourceString}`
            );
          }
          ft_name = ft_name[name.sourceString];
          if (!ft_name) {
            throw new Error(
              `Can't find field ${name.sourceString} of ${t.sourceString}`);
          }

         return {
            name: name.sourceString, "of": {
              name: t.sourceString,
              fqelement: mapped_cliche.fqelement
            },
            "type": {
              name: ft_name,
              fqelement: mapped_cliche.fqelement
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
      .addOperation("widgets", {
        Decl: decl => decl.widgets(),
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .reject(para.widgets(), _u.isEmpty),
        ClicheDecl: (cliche, name, key1, para, key2) => _u
          .reject(para.widgets(), _u.isEmpty),
        Paragraph_widget: decl => decl.widgets(),
        Paragraph_data: decl => [], Paragraph_assignment: decl => [],
        WidgetDecl: (m, w, name, wUses, k1, fields, k2, r) => name.sourceString
      })
      .addOperation("widgetsTree", {
        Decl: decl => decl.widgetsTree(),
        AppDecl: (app, name, uses, key1, para, key2) => [],
        ClicheDecl: (cliche, name, key1, para, key2) => _u
          .filter(para.widgetsTree(), w => !_u.isEmpty(w)),
        Paragraph_widget: decl => decl.widgetsTree(),
        Paragraph_data: decl => [], Paragraph_assignment: decl => [],
        WidgetDecl: (m, w, n1, wUses, k1, fields, k2, r) => {
          const ret:{name?: string, children?: any[]} = {};
          ret.name = n1.sourceString;
          const children = _u.chain(wUses.widgetsTree())
            .flatten().reject(_u.isEmpty).value();
          if (!_u.isEmpty(children)) ret.children = children;
          return ret;
        },
        WidgetUsesDecl: (u, used_widget, comma, used_widgets) => []
          .concat(_u.reject([used_widget.widgetsTree()], _u.isEmpty))
          .concat(_u
            .chain(used_widgets.widgetsTree()).flatten()
            .reject(_u.isEmpty)
            .value()),
        UsedWidgetDecl: (used_widget_name, as_decl) => {
          const ret:{name?: string} = {};
          const name = used_widget_name.widgetsTree();
          if (name) ret.name = name;
          return ret;
        },
        usedWidgetName: (cliche, dot, name) => {
          return (!cliche.sourceString) ? name.sourceString : "";
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
      // A map of of -> field name -> type name
      .addOperation("fieldTypesMap", {
        Decl: decl => _u
            .chain(decl.fieldTypesMap())
            .reject(_u.isEmpty)
            .reduce((memo, ft) => {
              if (memo[ft.of] !== undefined) {
                throw new Error("Duplicate type " + ft.of);
              }
              memo[ft.of] = _u
                .reduce(ft.fields, (memo, ft) => {
                  if (memo[ft.name] !== undefined) {
                    throw new Error("Duplicate field " + ft.name);
                  }
                  memo[ft.name] = ft.t;
                  return memo;
                }, {});
              return memo;
            }, {})
            .value(),
        AppDecl: (app, name, uses, key1, para, key2) => para.fieldTypesMap(),
        ClicheDecl: (cliche, name, key1, para, key2) => para.fieldTypesMap(),
        Paragraph_widget: decl => decl.fieldTypesMap(),
        Paragraph_data: decl => decl.fieldTypesMap(),
        Paragraph_assignment: decl => ({}),
        DataDecl: (data, name, key1, fields, key2, bond) => {
          return {
            "of": name.sourceString,
            fields: _u.flatten(fields.fieldTypesMap())
          };
        },
        WidgetDecl: (m, w, name, wU, k1, fields, k2, r) => {
          return {
            "of": name.sourceString,
            fields: _u.flatten(fields.fieldTypesMap())
          };
        },
        FieldBody: (field_decl, comma, field_decls) => {
          return [].concat(field_decl.fieldTypesMap())
            .concat(_u.flatten(field_decls.fieldTypesMap()));
        },
        FieldDecl: (name, colon, t, field_bond_decl) => {
          return {name: name.sourceString, t: t.sourceString};
        }
      })
      // A map of alias -> {alias, fqelement, type name}
      .addOperation("clicheMap", {
        Decl: decl => decl.clicheMap(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => {
          const cliche_name = name.sourceString;
          let ret = uses.clicheMap()[0];
          if (ret === undefined) ret = {};
          ret["this"] = {
            fqelement: `dv-samples-${cliche_name.toLowerCase()}`,
            name: cliche_name
          };
          return ret;
        },
        ClicheUsesDecl: (uses, name1, asDecl1, comma, name2, asDecl2) => {
          function get_list() {
            const name1_used_cliche_map = name1.clicheMap();
            return []
              .concat({
                alias: asDecl1.clicheMap()[0],
                fqelement: name1_used_cliche_map.fqelement,
                name: name1_used_cliche_map.name
              })
              .concat(
                _u.map(
                  _u.zip(asDecl2.clicheMap(), name2.clicheMap()),
                  alias_cliche => ({
                    alias: alias_cliche[0][0],
                    fqelement: alias_cliche[1].fqelement,
                    name: alias_cliche[1].name
                  })
                )
              );
          }
          const ret = {};

          const seen_names = {};
          const have_multiple = {};
          const count = {};
          const list_of_entries = get_list();
          _u.flatten(list_of_entries).forEach(c => {
            if (c.alias) {
              if (seen_names[c.name]) {
                have_multiple[c.name] = true;
              }
              seen_names[c.name] = true;
            }
          });
          _u.flatten(list_of_entries).forEach(c => {
            if (have_multiple[c.name]) {
              if (count[c.name] === undefined) {
                count[c.name] = 1;
              } else {
                count[c.name] = count[c.name] + 1;
              }
              c.fqelement = c.fqelement + "-" + count[c.name];
            }
            ret[c.alias ? c.alias : c.name] = c;
          });
          return ret;
        },
        AsDecl: (_, name) => {
          return name.sourceString;
        },
        usedClicheName: (category, slash, name) => ({
          name: name.sourceString,
          fqelement: `dv-${category.sourceString}-` +
            `${name.sourceString.toLowerCase()}`
        })
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
            fqelement: this._cliche_map[cliche.sourceString].fqelement
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
              memo[r.widget.fqelement] = r_in;
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
              name: this.name,
              fqelement: this._cliche_map["this"].fqelement
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
              "name": this._this_ft_map[ct2.sourceString][n2.sourceString],
              "fqelement": this._cliche_map["this"].fqelement
            },
            "maps_to": n1.sourceString
          };
          return ret;
        },
        replaceName: (cliche, dot, widget) => {
          return {
            name: widget.sourceString,
            fqelement: this._cliche_map[cliche.sourceString].fqelement
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
      // A map of id -> type
      .addOperation("symbolTable", {
        Decl: decl => _u
          .reduce(decl.symbolTable(), (memo, s) => {
            memo[s.id] = s;
            return memo;
          }, {}),
        ClicheDecl: (cliche, name, key1, para, key2) => para.symbolTable(),
        AppDecl: (app, name, uses, key1, para, key2) => para.symbolTable(),
        Paragraph_data: decl => decl.symbolTable(),
        Paragraph_widget: decl => decl.symbolTable(),
        Paragraph_assignment: decl => decl.symbolTable(),
        DataDecl: (data, name, k1, fields, k2, bonds) => ({
          id: name.sourceString, type: "data"}),
        WidgetDecl: (main, widget, name, uses, k1, fields, k2, replace) => ({
          id: name.sourceString, type: "widget"}),
        AssignmentDecl: (name, colon, t_name, assign, obj) => ({
          id: name.sourceString, type: t_name.sourceString})
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
    this._cliche_map = s.clicheMap();
    this._this_ft_map = s.fieldTypesMap();
    // A map of cliche -> of -> field name -> type name
    this._ft_map = this._build_uses_ft_map(_u.uniq(_u.keys(s.usedCliches())));

    const widgets = s.widgets();
    if (s.isApp()) {
      return {
        used_cliches: s.usedCliches(),
        cliche_map: s.clicheMap(),
        ft_map: s.fieldTypesMap(),
        replace_map: s.replaceMap(),
        fqelement: s.fqelement(),
        uft_map: this._ft_map,
        used_widgets: this.used_widgets(widgets, s.replaceList()),
        main_widget: s.main(),
        widgets: widgets,
        tbonds: s.tbonds(),
        fbonds: s.fbonds(),
        wbonds: s.wbonds(),
        data: s.data()
      };
    } else {
      return {fqelement: s.fqelement(), widgets: widgets};
    }
  }

  /**
   * Gets all widgets from cliches used by the app by looking at the HTML files
   **/
  cliche_widgets_used(widgets: string[]): Widget[] {
    const fp = w => {
      const dashed = _ustring.dasherize(w).slice(1);
      return `src/components/${dashed}/${dashed}.html`;
    };
    const re = /<dv-widget\s*name="(.*)"\s*fqelement="(.*)"[^>]*>/g;
    return _u.chain(widgets)
      .map(w => fs.readFileSync(fp(w), "utf-8"))
      .map(html => {
        const ret = [];
        let match = re.exec(html);
        while (match !== null) {
          ret.push(match);
          match = re.exec(html);
        }
        return ret;
      })
      .reject(match => match === null)
      .flatten(true)
      .map(match => ({fqelement: match[2], name: match[1]}))
      .unique(false, w => w.fqelement + w.name)
      .value();
  }

  used_widgets(widgets: string[], replace_list: Widget[]): Widget[] {
    // fqelement -> widgets
    const widget_map = {};
    // Widgets that are replaced
    const replaced = _u.map(replace_list, w => w.name + w.fqelement);

    return _u
      .chain(this.cliche_widgets_used(widgets))
      .map(uw => {
        if (widget_map[uw.fqelement] === undefined) {
          widget_map[uw.fqelement] = _u
            .reduce(
              this._parse_cliche(uw.fqelement).widgetsTree(),
              (memo, w) => {
                memo[w.name] = w.children ? w.children : [];
                return memo;
              }, {});
        }
        const all_children = _u
          .chain(widget_map[uw.fqelement][uw.name])
          .map(c => [].concat(c, widget_map[uw.fqelement][c.name]))
          .flatten()
          .value();

        return []
          .concat(uw, _u.map(all_children, w => {
            w.fqelement = uw.fqelement;
            return w;
          }));
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

  isApp(parseObj: App | Cliche): parseObj is App {
    return (<App>parseObj).data !== undefined;
  }

  debug_match(fp: string) {
    const p = this.parse(fp);
    const debug = obj => JSON.stringify(obj, null, 2);

    if (this.isApp(p)) {
      console.log("//////////Used Cliches//////////");
      console.log(debug(p.used_cliches));
      console.log("//////////Cliche Map//////////");
      console.log(debug(p.cliche_map));
      console.log("//////////Field Types Map//////////");
      console.log(debug(p.ft_map));
      console.log("//////////Replace Map//////////");
      console.log(debug(p.replace_map));
      console.log("//////////Uses Field Types Map//////////");
      console.log(debug(p.uft_map));
      console.log("//////////Used Widgets//////////");
      console.log(debug(p.used_widgets));
      console.log(`//////////Main widget is ${p.main_widget}//////////`);
      console.log("//////////Widgets//////////");
      console.log(debug(p.widgets));
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

  private _build_uses_ft_map(used_cliches: string[]) {
    const get_ftmap_of_cliche = c => this._parse_cliche(c).fieldTypesMap();
    return _u
      .reduce(used_cliches, (memo, c) => {
        memo[c] = get_ftmap_of_cliche(c);
        return memo;
      }, {});
  }

  private _parse_cliche(cliche) {
    function get_fp(cliche) {
      const cliche_split = cliche.split("-");
      const category = cliche_split[1];
      const name = cliche_split[2];
      return `../../catalog/${category}/${name}/${name}.dv`;
    }

    const dv = fs.readFileSync(get_fp(cliche), "utf-8");
    const r = this._grammar.match(dv);
    if (r.failed()) {
      throw new Error("Failed to parse " + cliche + " " + r.message);
    }
    return this._semantics(r);
  }
}
