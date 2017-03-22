module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-organization-list",
      [{name: "NewList"}, {name: "EditList"}, {name: "ShowList"}, {name: "ShowItem"}, {name: "AddItem"}]);
}
