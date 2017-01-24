const ohm = require("ohm-js");
import * as fs from "fs";
import * as path from "path";

import * as _u from "underscore";


const grammar_path = path.join(__dirname, "grammar.ohm");
const grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
const semantics = grammar.createSemantics()
  .addOperation("tbonds", {
    ClicheDecl: (cliche, name, uses, key1, para, key2) => _u
      .chain(para.tbonds()).reject(_u.isEmpty).value()[0],
    Paragraph_widget: decl => [],
    Paragraph_data: decl => decl.tbonds(),
    DataDecl: (data, name, key1, fields, key2, bond) => {
      const subtype = name.sourceString;
      return _u.map(bond.tbonds(), tbond => ({
        subtype: subtype, types: _u.flatten(bond.tbonds())
      }));
    },
    DataBondDecl: (eq, data_bond, bar, data_bonds) => {
      return [data_bond.tbonds(), data_bond.tbonds()];
    },
    DataBond: (data_bond_name, plus, data_bond_names) => {
      return [].concat(data_bond_name.tbonds())
        .concat(data_bond_names.tbonds());
    },
    dataBondName: (cliche, dot, name) => {
      return {name: name.sourceString, cliche: cliche.sourceString};
    }
  })
  .addOperation("fbonds", {
    ClicheDecl: (cliche, name, uses, key1, para, key2) => _u
      .chain(para.fbonds())
      .flatten()
      .reject(_u.isEmpty)
      .value(),
    Paragraph_widget: decl => [],
    Paragraph_data: decl => decl.fbonds(),
    DataDecl: (data, name, key1, fields, key2, bond) => fields.fbonds(),
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
            subfield: subfield, fields: fbond
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
    fieldBondName: (cliche, dot1, t, dot2, name) => {
      return {
        name: name.sourceString, "type": {
          name: t.sourceString,
          cliche: cliche.sourceString
        }
      };
    }
  })
  .addOperation("wcomp", {
  })
  .addOperation("widgets", {
    ClicheDecl: (cliche, name, uses, key1, para, key2) => _u
      .filter(para.widgets(), w => !_u.isEmpty(w)),
    Paragraph_widget: decl => decl.widgets(),
    Paragraph_data: decl => [],
    WidgetDecl: (m, w, n1, route_decl, wUses, k1, fields, k2) => {
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
    ClicheDecl: (cliche, name, uses, key1, para, key2) => _u
      .find(para.main(), m => m),
    Paragraph_widget: decl => decl.main(),
    Paragraph_data: decl => "",
    WidgetDecl: (m, w, n1, route, wUses, k1, fields, k2) => m.
      sourceString ? n1.sourceString : ""
  })
  .addOperation("usedCliches", {
    ClicheDecl: (cliche, name, uses, key1, para, key2) => {
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
      return `dv-${category.sourceString}-${name.sourceString.toLowerCase()}`;
    }
  })
  .addOperation("usedClicheMap", {
    ClicheDecl: (cliche, name, uses, key1, para, key2) => uses
      .usedClicheMap()[0],
    ClicheUsesDecl: (uses, name1, asDecl1, comma, name2, asDecl2) => {
      function get_list() {
        const name1_used_cliche_map = name1.usedClicheMap();
        return []
          .concat({
            alias: asDecl1.usedClicheMap()[0],
            fqelement: name1_used_cliche_map.fqelement,
            name: name1_used_cliche_map.name
          })
          .concat(
            _u.map(
              _u.zip(asDecl2.usedClicheMap(), name2.usedClicheMap()),
              alias_cliche => ({
                alias: alias_cliche[0][0],
                fqelement: alias_cliche[1].fqelement,
                name: alias_cliche[1].name
              })
            )
          );
      }
      const ret = {};
      _u.flatten(get_list()).forEach(c => {
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
    ClicheDecl: (cliche, name, uses, key1, para, key2) => {
      const cliche_map = uses.usedClicheMap()[0];
      return _u.chain(para.usedWidgets()).flatten()
         // Ignore widgets that are of the current cliche
        .filter(w => cliche_map[w.cliche])
        .map(w => {
          const mapped_cliche = cliche_map[w.cliche];
          if (!mapped_cliche) {
            throw new Error(`Can't find cliche ${mapped_cliche}`);
          }
          return {name: w.name, fqelement: mapped_cliche.fqelement};
        })
        .value();
    },
    Paragraph_widget: decl => decl.usedWidgets(),
    Paragraph_data: decl => [],
    WidgetDecl: (m, w, n1, route, wUses, k1, fields, k2) => wUses.usedWidgets(),
    WidgetUsesDecl: (u, used_widget1, comma, used_widgets) => []
      .concat(used_widget1.usedWidgets())
      .concat(used_widgets.usedWidgets()),
    UsedWidgetDecl: (name, as_decl, route) => name.usedWidgets(),
    usedWidgetName: (cliche, dot, name) => ({
      name: name.sourceString, cliche: cliche.sourceString.slice(0, -1)
    })
  });
// console.log(grammar);
debug_match("../../catalog/messaging/post/post.dv");
debug_match("../../samples/morg/morg.dv");
debug_match("../../samples/bookmark/bookmark.dv");


function debug_match(fp) {
  const dv = fs.readFileSync(fp, "utf-8");
  // console.log(dv);
  const r = grammar.match(dv);
  console.log(`The matching for ${fp} succeeded: ${r.succeeded()}`);
  if (r.failed()) {
    console.log(r.message);
    // console.log(grammar.trace(dv).toString());
  } else {
    console.log("Used Cliches");
    console.log(semantics(r).usedCliches());
    console.log("Used Cliche Map");
    console.log(JSON.stringify(semantics(r).usedClicheMap()));
    console.log("Used Widgets");
    console.log(JSON.stringify(semantics(r).usedWidgets()));
    console.log(`Main widget is ${semantics(r).main()}`);
    console.log("Widgets");
    console.log(JSON.stringify(semantics(r).widgets()));
    console.log("tbonds");
    console.log(JSON.stringify(semantics(r).tbonds()));
    console.log("fbonds");
    console.log(JSON.stringify(semantics(r).fbonds()));
  }
}
