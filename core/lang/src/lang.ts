const ohm = require("ohm-js");
import * as fs from "fs";
import * as path from "path";


const grammar_path = path.join(__dirname, "grammar.ohm");
const grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
const semantics = grammar.createSemantics()
  .addOperation("comp", {
  })
  .addOperation("wcomp", {
  })
  .addOperation("routeInfo", {
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
  .addOperation("usedWidgets", {
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
    console.log(semantics(r).usedCliches());
  }
}
