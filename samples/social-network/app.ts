/// <reference path="typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");

import {db} from "./db";

const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
