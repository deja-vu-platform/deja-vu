const command_line_args = require("command-line-args");
import {Parser, Cliche} from "./parser";
import {GruntTask} from "mean-loader";

import * as fs from "fs";

const grunt = require("grunt");

const cli = command_line_args([
  {name: "file", alias: "f", type: String, defaultOption: true},

  // Mode can be "dev" or "test".  In dev mode the development page is shown,
  // in test mode the main widget is shown
  {name: "mode", type: String, defaultValue: "dev"},
  {name: "debug", type: Boolean, defaultValue: false}
]);


function main() {
  const opts = cli.parse();
  const p = new Parser();

  if (opts.file === undefined) {
    for (const f of fs.readdirSync(process.cwd())) {
      if (f.endsWith(".dv")) {
        console.log("Using dv file " + f);
        opts.file = f;
        break;
      }
    }
  }

  if (opts.debug) {
    p.debug_match(opts.file);
    return;
  }

  const cliche: Cliche = p.parse(opts.file);

  grunt.task.init = () => ({});
  GruntTask.task(
    grunt, cliche.fqelement,
    cliche.widgets,
    cliche.main_widget,
    cliche.used_cliches,
    cliche.used_widgets,
    cliche.replace_map);
  grunt.tasks(["dv-mean:test"]);
}

main();
