module.exports = function(grunt) {
  require("grunt-dv").GruntTask.cliche_task(
      grunt,
      "Event",
      ["NewWeeklyEvent", "ChooseAndShowWeeklyEvent"]);
}
