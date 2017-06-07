const command_line_args = require("command-line-args");
import {ClicheParser} from "./cliche_parser";
import {AppParser, App} from "./app_parser";
import {GruntTask} from "mean-loader";

import * as fs from "fs";

const grunt = require("grunt");

const cli = command_line_args([
  {name: "file", alias: "f", type: String, defaultOption: true},

  // Apps can can be run in "dev" or "test" mode. In dev mode, the development
  // page is shown. In test mode, the main widget is shown
  // todo: let apps be run in dev mode
  // {name: "mode", type: String, defaultValue: "dev"},
  {name: "debug", type: Boolean, defaultValue: false}
]);


function main() {
  const opts = cli.parse();

  if (opts.file === undefined) {
    for (const f of fs.readdirSync(process.cwd())) {
      if (f.endsWith(".dv")) {
        console.log("Using dv file " + f);
        opts.file = f;
        break;
      }
    }
  }

  let p;
  if (opts.file.includes("catalog")) {
    p = new ClicheParser();
  } else {
    p = new AppParser();

    if (opts.debug) {
      p.debug_match(opts.file);
    } else {
      const pObj: App = p.parse(opts.file);

      grunt.task.init = () => ({});
      GruntTask.app_task(
        grunt, pObj.fqelement,
        pObj.widgets,
        pObj.main_widget,
        pObj.used_cliches,
        pObj.used_widgets,
        pObj.replace_map,
        {"tbonds": pObj.tbonds, "fbonds": pObj.dfbonds},
        {"wbonds": pObj.wfbonds},
        {"nfbonds": pObj.nfbonds},
        pObj.data);
      grunt.tasks(["dv-mean:test"]);
    }
  }
}

main();
