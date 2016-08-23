module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-access-auth",
      [{name: "Register"}, {name: "SignIn"}, {name: "LoggedIn"}]);
}
