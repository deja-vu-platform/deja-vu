/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as express from "express";
import morgan = require('morgan');
import {Collection} from "mongodb";

import {db} from "./db";


interface Request extends express.Request {
  users: Collection;
  fields;
}

module Validation {
  function _exists(username, req, res, next) {
    if (!req.users) req.users = db.collection('users');
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
    if (req.params.userid == req.params.friendid) {
      res.status(400);
      next.send("userid match friendid");
    } else {
      next();
    }
  }
}

module Processor {
  export function fields(req, unused_res, next) {
    var fields = req.query.fields;
    if (fields) {
      var ret = {}
      fields.split(',').forEach(e => ret[e] = 1);
      req.fields = ret;
    }
    next();
  }
}

var app = express();

app.use(morgan('dev'));
app.use(express.static(__dirname));

//
// API
//
app.get(
  '/api/users/:userid/potential_friends',
  Validation.userExists,
  Processor.fields,
  (req: Request, res, next) => {
    var query = {
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
  '/api/users/:userid/friends',
  Validation.userExists,
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
          })
        });
    });
  });

var updateOne = (users, userid, update, next) => {
  users.updateOne({username: userid}, update, (err, user) => {
    if (err) return next(err);
  });
};

app.put(
  '/api/users/:userid/friends/:friendid',
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  (req: Request, res, next) => {
    var userid = req.params.userid;
    var friendid = req.params.friendid;
    updateOne(req.users, userid, {$addToSet: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$addToSet: {friends: userid}}, next);
    res.json({});
  });

app.delete(
  '/api/users/:userid/friends/:friendid',
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  (req: Request, res, next) => {
    var userid = req.params.userid;
    var friendid = req.params.friendid;
    updateOne(req.users, userid, {$pull: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$pull: {friends: userid}}, next);
    res.json({});
  });


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
