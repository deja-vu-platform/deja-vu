const ohm = require("ohm-js");
import * as fs from "fs";
import * as path from "path";

import * as _u from "underscore";


const grammar_path = path.join(__dirname, "grammar.ohm");
const grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
const semantics = grammar.createSemantics()
  .addOperation("comp", {
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
  }
}
