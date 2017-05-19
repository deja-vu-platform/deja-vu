module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "Task",
      ["ShowTask", "CreateTask", "ShowUncompletedTasks",
       "ShowUnapprovedTasks", "ShowApprovedTasks", 
       "ShowAssignedTasks", "ShowPendingApprovalTasks"]);
}
