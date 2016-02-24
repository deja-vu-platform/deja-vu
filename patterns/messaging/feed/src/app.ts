/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import * as mongodb from "mongodb";

import {Mean} from "mean";


const mean = new Mean("feed", (db, debug) => {
  db.createCollection("subs", (err, subs) => {
    if (err) throw err;
    if (debug) {
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
      if (debug) {
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
// API
//
interface Request extends express.Request {
  subs: mongodb.Collection;
}

namespace Validation {
  export function SubExists(req, res, next) {
    const name = req.params.name;
    if (!req.subs) req.subs = mean.db.collection("subs");
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

mean.app.get(
  "/subs/:name/feed",
  Validation.SubExists,
  mean.bus.crud("subs"),
  (req: Request, res, next) => {
    req.subs.findOne({name: req.params.name}, (err, sub) => {
      if (err) return next(err);
      if (!sub.subscriptions) {
        res.json([]);
        return;
      }
      mean.db.collection("pubs", {strict: true}, (err, pubs) => {
        if (err) return next(err);
        pubs.find({name: {$in: sub.subscriptions}}).toArray((err, pubs) => {
          res.json(pubs);
        });
      });
    });
  });
