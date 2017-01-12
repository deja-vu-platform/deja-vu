module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-messaging-comment",
      [{name: "NewComment"}, {name: "Comments"},
       {name: "CommentsWithComment"}, {name: "Comment"}]);
}
