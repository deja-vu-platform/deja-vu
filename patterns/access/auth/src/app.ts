/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import * as mongodb from "mongodb";
import * as bodyParser from "body-parser";
import bcrypt = require("bcryptjs");

import {Mean} from "mean";
import {User} from "./shared/data";


const mean = new Mean("auth", (db, debug) => {
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (debug) {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
      });
    }
  });
});

// temp hack
function cors(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
      "Access-Control-Allow-Methods",
      "POST, GET, OPTIONS, PUT, DELETE");
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept");
  next();
}

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
    if (!req.users) req.users = mean.db.collection("users");
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

mean.app.options("/signin", cors);
mean.app.options("/register", cors);

mean.app.post(
  "/signin",
  cors,
  Parsers.json, Parsers.user,
  mean.bus.crud("User"),
  (req, res, next) => {
    mean.db.collection("users").findOne(
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

mean.app.post(
  "/register",
  cors,
  Parsers.json, Parsers.user,
  Validation.userIsNew,
  mean.bus.crud("User"),
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
