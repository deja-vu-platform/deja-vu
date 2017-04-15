module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(
      grunt,
      "dv-organization-market",
      [{name: "AffordTable"}, {name: "CreateGood"}, {name: "AddAmount"}, 
        {name: "ShowBalance"}, {name: "BuyGoodAtFractionOfPrice"}]);
}
