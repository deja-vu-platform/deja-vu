module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
    grunt,
    "Checkist",
    [
      "NewChecklist",
      "EditChecklist",
      "ShowChecklist",
      "ShowItem",
      "AddItem",
      "EditItemChecked"
    ]
  );
}
