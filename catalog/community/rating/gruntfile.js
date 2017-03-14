module.exports = function (grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-community-rating",
      [{name: "RateTarget"}]);
}
