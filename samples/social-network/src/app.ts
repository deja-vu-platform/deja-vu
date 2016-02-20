/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");


const env = process.env.NODE_ENV || "dev";
const wsport = process.env.WS_PORT || 3000;

const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname + "/public"));


app.listen(wsport, () => {
  console.log(`Listening on port ${wsport} in mode ${env}`);
});
