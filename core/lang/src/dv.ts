const command_line_args = require("command-line-args");
import {Parser, Cliche} from "./parser";
import {GruntTask} from "mean-loader";
const grunt = require("grunt");

const cli = command_line_args([
  {name: "file", alias: "f", type: String, defaultOption: true},

  // Mode can be "dev" or "test".  In dev mode the development page is shown,
  // in test mode the main widget is shown
  {name: "mode", type: String, defaultValue: "dev"}
]);

const opts = cli.parse();
const p = new Parser();
const cliche: Cliche = p.parse(opts.file);
console.log(JSON.stringify(cliche, null, 2));

grunt.task.init = () => ({});
GruntTask.task(
  grunt, "name",
  cliche.widgets,
  cliche.main_widget,
  cliche.used_cliches,
  cliche.used_widgets);
grunt.tasks(["dv-mean:test"]);
