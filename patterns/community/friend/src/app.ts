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
export const db = new mongodb.Db("frienddb", server, { w: 1 });
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
  function _exists(username, req, res, next) {
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

  export function userExists(req, res, next) {
    _exists(req.params.userid, req, res, next);
  }

  export function friendExists(req, res, next) {
    _exists(req.params.friendid, req, res, next);
  }

  export function friendNotSameAsUser(req, res, next) {
    if (req.params.userid === req.params.friendid) {
      res.status(400);
      next.send("userid match friendid");
    } else {
      next();
    }
  }
}

namespace Processor {
  export function fields(req, unused_res, next) {
    const fields = req.query.fields;
    if (fields) {
      const ret = {};
      fields.split(",").forEach(e => ret[e] = 1);
      req.fields = ret;
    }
    next();
  }
}


app.get(
  "/api/users/:userid/potential_friends",
  Validation.userExists,
  bus.crud("friends"),
  Processor.fields,
  (req: Request, res, next) => {
    const query = {
    $and: [
      {friends: {$nin: [req.params.userid]}},
      {username: {$ne: req.params.userid}}
    ]};
    req.users.find(query, req.fields, (err, friends) => {
      if (err) return next(err);
      friends.toArray((err, arr) => {
        if (err) return next(err);
        res.json(arr);
      });
    });
  });

app.get(
  "/api/users/:userid/friends",
  Validation.userExists,
  bus.crud("friends"),
  Processor.fields,
  (req: Request, res, next) => {
    req.users.findOne({username: req.params.userid}, (err, user) => {
      if (err) return next(err);
      if (!user.friends) {
        res.json([]);
        return;
      }
      req.users.find(
        {username: {$in: user.friends}}, req.fields,
        (err, users) => {
          if (err) return next(err);
          users.toArray((err, arr) => {
            if (err) return next(err);
            res.json(arr);
          });
        });
    });
  });

const updateOne = (users, userid, update, next) => {
  users.updateOne({username: userid}, update, (err, user) => {
    if (err) return next(err);
  });
};

app.put(
  "/api/users/:userid/friends/:friendid",
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  bus.crud("friends"),
  (req: Request, res, next) => {
    const userid = req.params.userid;
    const friendid = req.params.friendid;
    updateOne(req.users, userid, {$addToSet: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$addToSet: {friends: userid}}, next);
    res.json({});
  });

app.delete(
  "/api/users/:userid/friends/:friendid",
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  bus.crud("friends"),
  (req: Request, res, next) => {
    const userid = req.params.userid;
    const friendid = req.params.friendid;
    updateOne(req.users, userid, {$pull: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$pull: {friends: userid}}, next);
    res.json({});
  });
