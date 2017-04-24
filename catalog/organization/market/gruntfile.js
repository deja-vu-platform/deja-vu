module.exports = function(grunt) {
  require("mean-loader").GruntTask.cliche_task(
      grunt,
      "Market",
      ["AffordTable", "CreateGood", "AddAmount",
       "ShowBalance", "BuyGood", "BuyGoodAtFractionOfPrice",
       "ShowMyGoods", "ShowGoodsToBuy"]);
}
