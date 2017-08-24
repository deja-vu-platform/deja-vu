module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "Checklist",
      [
        "NewChecklist",
        "EditChecklist",
        "ShowChecklist",
        "ShowItem",
        "AddItem",
        "EditItemChecked"
      ]);
}
