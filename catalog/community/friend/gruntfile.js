module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-community-friend",
      [{name: "AddFriend"}, {name: "Friends"}]);
}
