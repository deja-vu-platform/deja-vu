module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "dv-organization-group",
      ["ShowMember", "ShowGroup", "NewGroup"]);
}
