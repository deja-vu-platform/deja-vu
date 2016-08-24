module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-messaging-feed",
      [{name: "Feed"}]);
}
