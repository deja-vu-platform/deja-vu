/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
import * as express from "express";
import morgan = require('morgan');

import {db} from "./db";


module Validation {
  function _exists(username, res, next) {
    db.collection('users', {strict: true}, (err, users) => {
      if (err) { console.log(err); return; }
      users.findOne({username: username}, (err, user) => {
        if (err) { console.log(err); return; }
        if (!user) {
          res.status(400);
          next(`user ${username} not found`);
        } else {
          next();
        }
      });
    });
  }
  
  export function userExists(req, res, next) {
    _exists(req.params.userid, res, next);
  }
  
  export function friendExists(req, res, next) {
    _exists(req.params.friendid, res, next);
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
     req.query.fields = ret;
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
  (req, res) => {
    db.collection('users', {strict: true}, (err, users) => {
      if (err) { console.log(err); return; }
      var query = {friends: {$nin: [req.params.userid]}};
      users.find(query, req.query.fields, (err, friends) => {
        if (err) { console.log(err); return; }
        friends.toArray((err, arr) => {
          if (err) { console.log(err); return; }
          res.json(arr);
        });
      });
    });
  });

app.get(
  '/api/users/:userid/friends',
  Validation.userExists,
  Processor.fields,
  (req, res) => {
    db.collection('users', {strict: true}, (err, users) => {
      if (err) { console.log(err); return; }
      users.findOne({username: req.params.userid}, (err, user) => {
        if (err) { console.log(err); return; }
        if (!user.friends) {
          res.json([]);
          return;
        }
        users.find(
          {username: {$in: user.friends}}, req.query.fields,
          (err, users) => {
            if (err) { console.log(err); return; }
            users.toArray((err, arr) => {
              if (err) { console.log(err); return; }
              res.json(arr);
            })
          });
      });
    });
  });

var updateOne = (users, userid, friendid, update) => {
  users.updateOne(
    {username: userid}, update, (err, user) => {
      if (err) { console.log(err); return; }
  });
};

app.put(
  '/api/users/:userid/friends/:friendid',
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  (req, res) => {
    db.collection('users', {strict: true}, (err, users) => {
      if (err) { console.log(err); return; }
      var userid = req.params.userid;
      var friendid = req.params.friendid;
      updateOne(users, userid, friendid, {$addToSet: {friends: friendid}});
      updateOne(users, friendid, userid, {$addToSet: {friends: userid}});
    });
  });

app.delete(
  '/api/users/:userid/friends/:friendid',
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  (req, res) => {
    db.collection('users', {strict: true}, (err, users) => {
      if (err) { console.log(err); return; }
      var userid = req.params.userid;
      var friendid = req.params.friendid;
      updateOne(users, userid, friendid, {$pull: {friends: friendid}});
      updateOne(users, friendid, userid, {$pull: {friends: userid}});
    });
  });


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
