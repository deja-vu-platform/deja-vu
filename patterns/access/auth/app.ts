/// <reference path="typings/tsd.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
import morgan = require("morgan");
import * as mongodb from "mongodb";
import bcrypt = require("bcryptjs");

import {RestBus} from "../../../core/modules/rest_bus/rest.bus";
import {User} from "./auth/data";

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
export const db = new mongodb.Db("authdb", server, { w: 1 });
db.open((err, db) => {
  if (err) throw err;
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (env === "dev") {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
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
  app.use(express.static(__dirname));
}

app.listen(wsport, () => {
  console.log(`Listening on port ${wsport} in mode ${env}`);
});


//
// API
//
interface Request extends express.Request {
  user: User;
  users: mongodb.Collection;
}

namespace Parsers {
  export const json = bodyParser.json();

  export function user(req, res, next) {
    req.user = req.body;
    next();
  }
}

namespace Validation {
  export function userIsNew(req, res, next) {
    if (!req.users) req.users = db.collection("users");
    req.users.findOne({username: req.user.username}, {_id: 1}, (err, user) => {
      if (err) return next(err);
      if (user) {
        res.status(400);
        return next(`user ${req.user.username} already exists`);
      }
      next();
    });
  }
}

app.post(
  "/signin",
  Parsers.json, Parsers.user,
  bus.crud("users"),
  (req, res, next) => {
    db.collection("users").findOne(
      {username: req.user.username},
      (err, user) => {
        if (err) return next(err);
        if (!user) {
          res.status(401);
          return next("Incorrect username");
        }
        console.log(user.password);
        console.log(req.user.password);
        bcrypt.compare(req.user.password, user.password, (err, bcrypt_res) => {
          if (err) return next(err);
          if (!bcrypt_res) {
            res.status(401);
            return next("Incorrect password");
          }
          console.log("sign in successful");
          res.json([]);
          next();
        });
      });
  });

app.post(
  "/register",
  Parsers.json, Parsers.user,
  Validation.userIsNew,
  bus.crud("users"),
  (req: Request, res, next) => {
    console.log(JSON.stringify(req.user));
    bcrypt.hash(req.user.password, 10, (err, hash) => {
      req.user.password = hash;
      console.log(req.user.password);
      req.users.insertOne(req.user, (err, write_res) => {
        if (err) return next(err);
        if (write_res.insertedCount !== 1) return next(err);
        console.log("all good");
        res.json([]);
        next();
      });
    });
  });
