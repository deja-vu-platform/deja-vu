const ohm = require("ohm-js");

import * as fs from "fs";
import * as path from "path";

import * as _u from "underscore";


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
  widgets: any[];
  tbonds: any[];
  fbonds: any[];
  wbonds: any[];
  data: any;
}
export interface Cliche {
  fqelement: string;
  widgets: any[];
}

export class Parser {
  cliche_map; of_name; name; ft_map; this_ft_map;
  private _grammar;
  private _semantics;

  constructor() {
    const grammar_path = path.join(__dirname, "grammar.ohm");
    this._grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
    this._semantics = this._grammar.createSemantics()
      .addOperation("tbonds", {
        Decl: decl => decl.tbonds(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          this.cliche_map = this._get_cliche_map(name.sourceString, uses);
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
          const mapped_cliche = this.cliche_map["this"];
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
          const mapped_cliche = this.cliche_map[cliche_name];
          if (!mapped_cliche) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          return {name: name.sourceString, fqelement: mapped_cliche.fqelement};
        },
        dataBondName_this: name => {
          const mapped_cliche = this.cliche_map["this"];
          return {name: name.sourceString, fqelement: mapped_cliche.fqelement};
        }
      })
      .addOperation("fbonds", {
        Decl: decl => decl.fbonds(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          const cliche_name = name.sourceString;
          this.cliche_map = uses.clicheMap()[0];
          if (this.cliche_map === undefined) this.cliche_map = {};
          this.cliche_map["this"] = {
            fqelement: `dv-samples-${cliche_name.toLowerCase()}`,
            name: cliche_name
          };
          this.ft_map = this._build_uses_ft_map(uses);
          this.this_ft_map = this._get_ft_map(para);
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
          const mapped_cliche = this.cliche_map["this"];
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
          const mapped_cliche = this.cliche_map[cliche_name];
          if (!mapped_cliche) {
            throw new Error(`Can't find cliche ${cliche_name}`);
          }
          let ft_key = mapped_cliche.fqelement;
          if (ft_key.split("-").length === 4) ft_key = ft_key.slice(0, -2);
          let ft_name = this.ft_map[ft_key][t.sourceString];
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
          const mapped_cliche = this.cliche_map["this"];

          let ft_name = this.this_ft_map[t.sourceString];
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
          const cliche_name = name.sourceString;
          this.cliche_map = uses.clicheMap()[0];
          if (this.cliche_map === undefined) this.cliche_map = {};
          this.cliche_map["this"] = {
            fqelement: `dv-samples-${cliche_name.toLowerCase()}`,
            name: cliche_name
          };
          this.ft_map = this._build_uses_ft_map(uses);
          this.this_ft_map = this._get_ft_map(para);

          return _u
            .chain(para.wbonds())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => decl.wbonds(),
        Paragraph_data: decl => [],
        Paragraph_assignment: decl => [],
        WidgetDecl: (m, w, name, route_decl, wU, k1, fields, k2, r) => {
          this.of_name = name.sourceString;
          return fields.fbonds();
        }
      })
      .addOperation("widgets", {
        Decl: decl => decl.widgets(),
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .filter(para.widgets(), w => !_u.isEmpty(w)),
        ClicheDecl: (cliche, name, key1, para, key2) => _u
          .filter(para.widgets(), w => !_u.isEmpty(w)),
        Paragraph_widget: decl => decl.widgets(),
        Paragraph_data: decl => [],
        Paragraph_assignment: decl => [],
        WidgetDecl: (m, w, n1, route_decl, wUses, k1, fields, k2, r) => {
          const ret:{name?: string, path?: string, children?: any[]} = {};
          ret.name = n1.sourceString;
          const path = route_decl.widgets();
          if (!_u.isEmpty(path)) ret.path = path[0];
          const children = _u.chain(wUses.widgets())
            .flatten().filter(c => !_u.isEmpty(c)).value();
          if (!_u.isEmpty(children)) ret.children = children;
          return ret;
        },
        WidgetUsesDecl: (u, used_widget, comma, used_widgets) => []
          .concat(_u.filter([used_widget.widgets()], c => !_u.isEmpty(c)))
          .concat(_u
            .chain(used_widgets.widgets()).flatten()
            .filter(c => !_u.isEmpty(c))
            .value()),
        UsedWidgetDecl: (used_widget_name, as_decl, route_decl) => {
          const ret:{name?: string, path?: string} = {};
          const name = used_widget_name.widgets();
          const path = route_decl.widgets();
          if (name) ret.name = name;
          if (!_u.isEmpty(path)) ret.path = path[0];
          return ret;
        },
        usedWidgetName: (cliche, dot, name) => {
          return (!cliche.sourceString) ? name.sourceString : "";
        },
        RouteDecl: (route, quote1, name, quote2) => name.sourceString
      })
      .addOperation("main", {
        Decl: decl => decl.main(),
        ClicheDecl: (cliche, name, key1, para, key2) => "",
        AppDecl: (app, name, uses, key1, para, key2) => _u
          .find(para.main(), m => m),
        Paragraph_widget: decl => decl.main(),
        Paragraph_data: decl => "",
        Paragraph_assignment: decl => "",
        WidgetDecl: (m, w, n1, route, wUses, k1, fields, k2, r) => m.
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
      // A map of cliche -> of -> field name -> type name
      .addOperation("usesFieldTypesMap", {
        Decl: decl => decl.usesFieldTypesMap(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => {
          return this._build_uses_ft_map(uses);
        }
      })
      // A map of of -> field name -> type name
      .addOperation("fieldTypesMap", {
        Decl: decl => decl.fieldTypesMap(),
        AppDecl: (app, name, uses, key1, para, key2) => this
          ._get_ft_map(para),
        ClicheDecl: (cliche, name, key1, para, key2) => this
          ._get_ft_map(para),
        Paragraph_widget: decl => decl.fieldTypesMap(),
        Paragraph_data: decl => decl.fieldTypesMap(),
        Paragraph_assignment: decl => ({}),
        DataDecl: (data, name, key1, fields, key2, bond) => {
          return {
            "of": name.sourceString,
            fields: _u.flatten(fields.fieldTypesMap())
          };
        },
        WidgetDecl: (m, w, name, route_decl, wU, k1, fields, k2, r) => {
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
      .addOperation("usedWidgets", {
        Decl: decl => decl.usedWidgets(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          const cliche_map = uses.clicheMap()[0];
          if (cliche_map === undefined) return [];
          return _u.chain(para.usedWidgets()).flatten()
             // Ignore widgets that are of the current cliche
            .filter(w => cliche_map[w.cliche])
            .map(w => {
              return {name: w.name, fqelement: cliche_map[w.cliche].fqelement};
            })
            .value();
        },
        Paragraph_widget: decl => decl.usedWidgets(),
        Paragraph_data: decl => [],
        Paragraph_assignment: decl => [],
        WidgetDecl: (
          m, w, n1, route, wUses, k1, fields, k2, r) => wUses.usedWidgets(),
        WidgetUsesDecl: (u, used_widget1, comma, used_widgets) => []
          .concat(used_widget1.usedWidgets())
          .concat(used_widgets.usedWidgets()),
        UsedWidgetDecl: (name, as_decl, route) => name.usedWidgets(),
        usedWidgetName: (cliche, dot, name) => ({
          name: name.sourceString, cliche: cliche.sourceString.slice(0, -1)
        })
      })
      .addOperation("replaceList", {
        Decl: decl => decl.replaceList(),
        ClicheDecl: (cliche, name, key1, para, key2) => [],
        AppDecl: (app, name, uses, key1, para, key2) => {
          this.cliche_map = this._get_cliche_map(name.sourceString, uses);
          return _u
            .chain(para.replaceList())
            .flatten()
            .reject(_u.isEmpty)
            .value();
        },
        Paragraph_widget: decl => decl.replaceList(),
        Paragraph_data: decl => ({}),
        Paragraph_assignment: decl => ({}),
        WidgetDecl: (
          m, w, name, route, wUses, k1, fields, k2, r) => r.replaceList(),
        ReplacesDecl: (r, r_name, i, in_name, k1, r_map, k2) => r_name
          .replaceList(),
        replaceName: (cliche, dot, widget) => {
          return {
            name: widget.sourceString,
            fqelement: this.cliche_map[cliche.sourceString].fqelement
          };
        }
      })
      // widget that is replaced -> replacement -> w field -> replacement field
      .addOperation("replaceMap", {
        Decl: decl => decl.replaceMap(),
        ClicheDecl: (cliche, name, key1, para, key2) => ({}),
        AppDecl: (app, name, uses, key1, para, key2) => {
          this.cliche_map = this._get_cliche_map(name.sourceString, uses);
          this.ft_map = this._get_ft_map(para);
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
        WidgetDecl: (
          m, w, name, route, wUses, k1, fields, k2, r) => {
            this.name = name.sourceString;
            return r.replaceMap();
          },
        ReplacesDecl: (r, r_name, i, in_name, k1, r_map, k2) => {
          return {
            widget: r_name.replaceMap(),
            in_widget: in_name.replaceMap(),
            replaced_by: {
              name: this.name,
              fqelement: this.cliche_map["this"].fqelement
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
              "name": this.ft_map[ct2.sourceString][n2.sourceString],
              "fqelement": this.cliche_map["this"].fqelement
            },
            "maps_to": n1.sourceString
          };
          return ret;
        },
        replaceName: (cliche, dot, widget) => {
          return {
            name: widget.sourceString,
            fqelement: this.cliche_map[cliche.sourceString].fqelement
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
        AssignmentDecl: (name, colon, t_name, assign, obj) => ({
          t_name: t_name.sourceString,
          obj: _u.extendOwn({atom_id: name.sourceString}, obj.data())
        }),
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
          return []
          .concat(val.data()).concat(more_val.data());
        },
        Value_ref: (name) => ({atom_id: name.sourceString})
      });
  }


  parse(fp: string): (App | Cliche) {
    const dv = fs.readFileSync(fp, "utf-8");
    const r = this._grammar.match(dv);
    if (r.failed()) {
      throw new Error(r.message);
    }
    const s = this._semantics(r);
    if (s.isApp()) {
      // fqelement -> widgets
      const widget_map = {};
      // Widgets that are replaced
      const replaced = _u.map(s.replaceList(), w => w.name + w.fqelement);
      return {
        used_cliches: s.usedCliches(),
        cliche_map: s.clicheMap(),
        ft_map: s.fieldTypesMap(),
        replace_map: s.replaceMap(),
        fqelement: s.fqelement(),
        uft_map: s.usesFieldTypesMap(),
        used_widgets: _u
          .chain(s.usedWidgets())
          .map(uw => {
            if (widget_map[uw.fqelement] === undefined) {
              widget_map[uw.fqelement] = _u
                .reduce(
                  this._parse_cliche(uw.fqelement).widgets(),
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
          // will appear twice, so we until want to filter it out once
          .filter(uw => {
            const replaced_index = replaced.indexOf(uw.name + uw.fqelement);
            if (replaced_index > -1) {
              replaced.splice(replaced_index, 1);
              return false;
            }
            return true;
          })
          .uniq(uw => uw.name + uw.fqelement)
          .value(),
        main_widget: s.main(),
        widgets: s.widgets(),
        tbonds: s.tbonds(),
        fbonds: s.fbonds(),
        wbonds: s.wbonds(),
        data: s.data()
      };
    } else {
      return {fqelement: s.fqelement(), widgets: s.widgets()};
    }
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

  private _build_uses_ft_map(uses) {
    const get_ftmap_of_cliche = c => this._parse_cliche(c).fieldTypesMap();
    const used_cliches = _u.uniq(_u.flatten(uses.usedCliches()));
    return _u
      .reduce(used_cliches, (memo, c) => {
        memo[c] = get_ftmap_of_cliche(c);
        return memo;
      }, {});
  }

  private _get_cliche_map(cliche_name, uses) {
    let ret = uses.clicheMap()[0];
    if (ret === undefined) ret = {};
    ret["this"] = {
      fqelement: `dv-samples-${cliche_name.toLowerCase()}`,
      name: cliche_name
    };
    return ret;
  }

  private _get_ft_map(para) {
    const ftmap = para.fieldTypesMap();
    return _u
      .chain(ftmap)
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
      .value();
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
