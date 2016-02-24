/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import * as mongodb from "mongodb";
import * as bodyParser from "body-parser";


import {Mean} from "mean";


const mean = new Mean("post", (db, debug) => {
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (debug) {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        users.insertMany([
          {username: "benbitdiddle", friends: []},
          {username: "alyssaphacker", friends: []},
          {username: "eva", friends: []},
          {username: "louis", friends: []},
          {username: "cydfect", friends: []},
          {username: "lem", friends: []}
        ], (err, res) => { if (err) throw err; });
      });
    }
  });
});


//
// API
//
interface Request extends express.Request {
  users: mongodb.Collection;
  fields;
}

namespace Validation {
  export function userExists(req, res, next) {
    const username = req.params.userid;
    if (!req.users) req.users = mean.db.collection("users");
    req.users.findOne({username: username}, {_id: 1}, (err, user) => {
      if (err) return next(err);
      if (!user) {
        res.status(400);
        next(`user ${username} not found`);
      } else {
        next();
      }
    });
  }
}

mean.app.get(
  "/users/:userid/posts",
  Validation.userExists,
  mean.bus.crud("posts"),
  (req: Request, res, next) => {
    req.users.findOne({username: req.params.userid}, (err, user) => {
      if (err) return next(err);
      if (!user.posts) {
        res.json([]);
        return;
      }
      res.json(user.posts);
    });
  });

const jsonParser = bodyParser.json();

mean.app.post(
  "/users/:userid/posts",
  Validation.userExists, jsonParser,
  mean.bus.crud("posts"),
  (req: Request, res, next) => {
    console.log(req.body);
    console.log(JSON.stringify(req.body));
    req.users.updateOne(
      {username: req.params.userid},
      {$push: {posts: req.body }},
      (err, user) => {
        if (err) return next(err);
        res.json({});
      });
  });
