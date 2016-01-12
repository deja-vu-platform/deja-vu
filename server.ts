/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
import * as express from "express";
import morgan = require('morgan');

import {db} from "./db";

var app = express();

app.use(morgan('dev'));
app.use(express.static(__dirname));
// api supports fields param
var getFields = (req, prefix = "", default_fields = {}) => {
  var fields = default_fields;
  if (req.query.fields) {
    fields = {};
    req.query.fields.split(',').forEach(e => fields[prefix + e] = 1);
  }
  console.log('return is ' + JSON.stringify(fields));
  return fields;
};
// supports ?not-friends-of=:userid
app.get('/api/users', (req, res) => {
  var fields = getFields(req);
  var query = {};
  var not_friends_of = req.query['not-friends-of'];
  if (not_friends_of) {
    query = {friends: {$nin: [not_friends_of]}};
  }
  console.log(JSON.stringify(query));
  db.collection('users', {strict: true}, (err, users) => {
    if (err) { console.log(err); return; }
    users.find(query, fields, (err, friends) => {
      if (err) { console.log(err); return; }
      friends.toArray((err, arr) => {
        if (err) { console.log(err); return; }
        res.json(arr);
      });
    });
  });
});

app.get('/api/users/:userid/friends', (req, res) => {
  var fields = getFields(req, 'friends', {friends: 1});
  db.collection('users', {strict: true}, (err, users) => {
    if (err) { console.log(err); return; }
    users.findOne({username: req.params.userid}, fields, (err, user) => {
      if (err) { console.log(err); return; }
      if (!user) {
        res.status(400).send("user not found");
        return;
      }
      users.find({username: {$in: user.friends}}, (err, users) => {
        if (err) { console.log(err); return; }
        users.toArray((err, arr) => {
          if (err) { console.log(err); return; }
          res.json(arr);
        })
      });
    });
  });
});

app.put('/api/users/:userid/friends/:friendid', (req, res) => {
  var userid = req.params.userid;
  var friendid = req.params.friendid;

  if (userid == friendid) {
    res.status(400).send("userid match friendid");
  }
  db.collection('users', {strict: true}, (err, users) => {
    if (err) { console.log(err); return; }

    users.findOne({username: friendid}, (err, user) => {
      if (user == null) {
        res.status(400).send("no friend");
        return;
      }
      updateOne(users, userid, friendid, {$addToSet: {friends: friendid}});
      updateOne(users, friendid, userid, {$addToSet: {friends: userid}});
    });
  });
});

var updateOne = (users, userid, friendid, update) => {
  users.updateOne(
    {username: userid}, update, (err, user) => {
      if (err) { console.log(err); return; }
  });
};
app.delete('/api/users/:userid/friends/:friendid', (req, res) => {
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
