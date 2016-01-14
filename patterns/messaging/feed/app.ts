/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/body-parser/body-parser.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
import morgan = require("morgan");
import {Collection} from "mongodb";

import {db} from "./db";


interface Request extends express.Request {
  subs: Collection;
}

namespace Validation {
  export function SubExists(req, res, next) {
    const name = req.params.name;
    if (!req.subs) req.subs = db.collection("subs");
    req.subs.findOne({name: name}, {_id: 1}, (err, sub) => {
      if (err) return next(err);
      if (!sub) {
        res.status(400);
        next(`subscriber ${name} not found`);
      } else {
        next();
      }
    });
  }
}

const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));

//
// API
//
app.get(
  "/api/subs/:name/feed",
  Validation.SubExists,
  (req: Request, res, next) => {
    req.subs.findOne({name: req.params.name}, (err, sub) => {
      if (err) return next(err);
      if (!sub.subscriptions) {
        res.json([]);
        return;
      }
      db.collection("publishers").find({name: {$in: sub.subscriptions}}, (err, pubs) => {
        res.json(pubs);
      });
    });
  });


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
