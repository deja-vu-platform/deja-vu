module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-organization-event",
      [{name: "NewWeeklyEvent"}, {name: "WeeklyEvent"}]);
}
