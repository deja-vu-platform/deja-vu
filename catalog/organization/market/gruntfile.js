module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-organization-market",
      [{name: "AffordTable"}, {name: "BuyGoodAtFractionOfPrice"}, {name: "CreateGood"}, 
      {name: "ShowBalance"}, {name: "AddAmount"}]);
}
