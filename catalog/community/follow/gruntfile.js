module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-community-follow",
      [{name: "Follow"}, {name: "EditFollow"}]);
}
