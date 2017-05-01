module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "List",
      ["NewList", "EditList", "ShowList", "ShowItem",  "AddItem", "EditItemChecked"]);
}
