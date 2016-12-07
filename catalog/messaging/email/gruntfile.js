module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-messaging-email",
      [{name: "SendEmail"}]);
}
