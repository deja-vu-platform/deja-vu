module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "StandardAuthentication",
      ["Register", "SignIn", "LoggedIn"]);
}
