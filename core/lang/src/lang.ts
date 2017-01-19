const ohm = require("ohm-js");
import * as fs from "fs";
import * as path from "path";


const grammar_path = path.join(__dirname, "grammar.ohm");
const grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
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
  }
}
