const ohm = require("ohm-js");
import * as fs from "fs";
import * as path from "path";

/**
 * Capitalized ("syntactic") rules implicitly skip whitespace characters
 * Lowercase ("lexical") rules don't
 **/

const grammar_path = path.join(__dirname, "grammar.ohm");
const grammar = ohm.grammar(fs.readFileSync(grammar_path, "utf-8"));
// console.log(grammar);
debug_match("../../catalog/messaging/post/post.dv");


function debug_match(fp) {
  const dv = fs.readFileSync(fp, "utf-8");
  const r = grammar.match(dv);
  console.log("The matching succeeded: " + r.succeeded());
  if (r.failed()) {
    console.log(r.message);
    // console.log(grammar.trace(dv).toString());
  }
}
