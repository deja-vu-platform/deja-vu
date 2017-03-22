module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "dv-organization-list",
      ["NewList", "EditList", "ShowList", "ShowItem",  "AddItem"]);
}
