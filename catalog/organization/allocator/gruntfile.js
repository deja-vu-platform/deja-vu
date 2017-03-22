module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "dv-organization-allocator",
      ["ShowConsumer", "EditConsumer"]);
}
