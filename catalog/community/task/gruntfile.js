module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "Task",
      ["ShowTask", "CreateTask", "CompleteTask", 
       "ApproveTask", "ShowUncompletedTasks",
       "ShowUnapprovedTasks", "ShowApprovedTasks", 
       "ShowAssignedTasks", "ShowPendingApprovalTasks"]);
}
