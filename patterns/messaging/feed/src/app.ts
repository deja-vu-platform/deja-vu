/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
import * as mongodb from "mongodb";
import {RestBus} from "rest-bus/rest.bus";


const env = process.env.NODE_ENV || "dev";
const dbhost = process.env.DB_HOST || "localhost";
const dbport = process.env.DB_PORT || 27017;
const wsport = process.env.WS_PORT || 3000;
const bus = new RestBus(
  process.env.BUS_HOST || "localhost",
  process.env.BUS_PORT || 3001);


//
// DB
//
const server = new mongodb.Server(dbhost, dbport, {auto_reconnect: true});
export const db = new mongodb.Db("feeddb", server, { w: 1 });
db.open((err, db) => {
  if (err) throw err;
  db.createCollection("subs", (err, subs) => {
    if (err) throw err;
    if (env === "dev") {
      subs.remove((err, remove_count) => {
        if (err) { console.log(err); return; }
        console.log(`Removed ${remove_count} elems`);

        subs.insertMany([
          {name: "Ben", subscriptions: [
            "Software Engineering News", "Things Ben Bitdiddle Says"]},
          {name: "Alyssa", subscriptions: []}
        ], (err, res) => { if (err) throw err; });
      });
    }
  });

  db.createCollection("pubs", (err, pubs) => {
    if (err) throw err;
    pubs.remove((err, remove_count) => {
      if (err) throw err;
      if (env === "dev") {
       pubs.insertMany([
         {name: "Software Engineering News", published: [
           "Node v0.0.1 released!"]},
         {name: "Things Ben Bitdiddle Says", published: ["Hi"]},
         {name: "U.S News", published: []},
         {name: "World News", published: []},
         {name: "New Books about Zombies", published: []}
       ], (err, res) => { if (err) throw err; });
      }
    });
  });
});


//
// WS
//
const app = express();

app.use(morgan("dev"));
if (env === "dev") {
  app.use(express.static(__dirname + "/public"));
}

app.listen(wsport, () => {
  console.log(`Listening on port ${wsport} in mode ${env}`);
});


//
// API
//
interface Request extends express.Request {
  subs: mongodb.Collection;
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

app.get(
  "/api/subs/:name/feed",
  Validation.SubExists,
  bus.crud("subs"),
  (req: Request, res, next) => {
    req.subs.findOne({name: req.params.name}, (err, sub) => {
      if (err) return next(err);
      if (!sub.subscriptions) {
        res.json([]);
        return;
      }
      db.collection("pubs", {strict: true}, (err, pubs) => {
        if (err) return next(err);
        pubs.find({name: {$in: sub.subscriptions}}).toArray((err, pubs) => {
          res.json(pubs);
        });
      });
    });
  });
