/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
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
export const db = new mongodb.Db("postdb", server, { w: 1 });
db.open((err, db) => {
  if (err) throw err;
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (env === "dev") {
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
  users: mongodb.Collection;
  fields;
}

namespace Validation {
  export function userExists(req, res, next) {
    const username = req.params.userid;
    if (!req.users) req.users = db.collection("users");
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

app.get(
  "/api/users/:userid/posts",
  Validation.userExists,
  bus.crud("posts"),
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

app.post(
  "/api/users/:userid/posts",
  Validation.userExists, jsonParser,
  bus.crud("posts"),
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
