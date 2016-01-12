/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as express from "express";
import * as mongodb from "mongodb";

var server = new mongodb.Server('localhost', 27017, {auto_reconnect: true})
var db = new mongodb.Db('frienddb', server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");
  db.createCollection('users', (err, users) => {
    console.log('Reseting existing users collection');
    users.remove((err, remove_count) => {
        if (err) { console.log(err); return; }
        console.log(`Removed ${remove_count} elems`);
      });
    users.insert([
      {username: "foo", friends: []},
      {username: "bar", friends: []}
    ], (err, res) => {
      if (err) { console.log(err); return; }
    });
  });
});



var friend = express();

friend.use(express.static(__dirname));
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
friend.get('/api/users', (req, res) => {
  console.log("getting all users");
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

friend.get('/api/users/:userid/friends', (req, res) => {
  console.log(`getting friends of ${req.params.userid}`);
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

friend.put('/api/users/:userid/friends/:friendid', (req, res) => {
  console.log(
      `adding ${req.params.friendid} as a friend of ${req.params.userid}`);
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
friend.delete('/api/users/:userid/friends/:friendid', (req, res) => {
  console.log(`unfriending ${req.params.friendid} and ${req.params.userid}`);
  db.collection('users', {strict: true}, (err, users) => {
    if (err) { console.log(err); return; }
    var userid = req.params.userid;
    var friendid = req.params.friendid;
    updateOne(users, userid, friendid, {$pull: {friends: friendid}});
    updateOne(users, friendid, userid, {$pull: {friends: userid}});
  });
});

friend.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${friend.settings.env}`);
});
