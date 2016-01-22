/// <reference path="typings/tsd.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
import morgan = require("morgan");
import {Collection} from "mongodb";
import bcrypt = require("bcryptjs");

import {db} from "./db";
import {User} from "./auth/data";


const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));

interface Request extends express.Request {
  user: User;
  users: Collection;
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

app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
