module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "Task",
      ["CreateTask", "ShowUncompletedTasks",
       "ShowUnapprovedTasks", "ShowApprovedTasks", 
       "ShowAssignedTasks", "ShowPendingApprovalTasks"]);
}
