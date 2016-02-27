/// <reference path="typings/tsd.d.ts" />
const fs = require("fs");
import * as express from "express";
import morgan = require("morgan");

// Read the config given as arg
// receive a config file with the compound info and use that to configure the
// bus
const fp = process.argv[2];
let config;

fs.readFile(fp, "utf8", (err, data) => {
  if (err) throw err;
  console.log(`Reading config from ${fp}`);
  config = JSON.parse(data);
  console.log("Done reading config");
  console.log(JSON.stringify(config));
});


const env = process.env.NODE_ENV || "dev";
const wsport = process.env.WS_PORT || 3001;


const app = express();

app.use(morgan("dev"));

app.listen(wsport, () => {
  console.log(`Listening on port ${wsport} in mode ${env}`);
});

const fw = (req, res, next) => {
  console.log(`${req.params.attr}`);
  console.log(config.merge.mappings);
  const mappings = config.merge.mappings[
    `${req.params.elem}/${req.params.rel}`];
  let count = 0;
  if (mappings) {
    mappings.forEach(m => {
      console.log("send to " + m);
      ++count;
    });
  }
  res.json({updated: count});
  next();
};

app.get("/:elem/:rel", fw);
app.post("/:elem/:rel", fw);
// create/element/relation
// read/element/relation
// update/element/relation
// delete/element/relation
//
// we get a crud update, and send a req to whoever corresponds using their
// crud route and then send the response back
// the original element must have already validated the input
