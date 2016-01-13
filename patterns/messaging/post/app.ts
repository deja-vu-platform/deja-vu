/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as express from "express";
import morgan = require("morgan");
import {Collection} from "mongodb";

import {db} from "./db";


interface Request extends express.Request {
  users: Collection;
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

const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));

//
// API
//
app.get(
  "/api/users/:userid/posts",
  Validation.userExists,
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

app.post(
  "/api/users/:userid/posts",
  Validation.userExists,
  (req: Request, res, next) => {
    req.users.updateOne(
      {username: req.params.userid},
      {$addToSet: {posts: { content: req.body }}},
      (err, user) => {
        if (err) return next(err);
        res.json({});
      });
  });


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
