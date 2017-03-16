module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "dv-messaging-comment",
      ["NewComment", "Comments", "CommentsWithComment", "ShowComment"]);
}
