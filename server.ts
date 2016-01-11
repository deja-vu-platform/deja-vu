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
// supports ?not-friends-of=:userid
friend.get('/api/users', (req, res) => {
  console.log("getting all users");
  var fields = {};
  if (req.query.fields) {
    req.query.fields.split(',').forEach(e => fields[e] = 1);
  }
  var query = {};
  if (req.query.not_friends_of) {
    query = {
      friends: {
        $not: {
          $elemMatch: {
            username: req.params.userid
          }
        }
      }
    };
  }
  console.log(`${JSON.stringify(fields)}`);
  db.collection('users', {strict: true}, (err, users) => {
    if (err) { console.log(err); return; }
    users.count((err, count) => {
      console.log(count);
    });

    users.find(query, {fields: fields}, (err, friends) => {
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
  res.json([{"username": "Bob"}, {"username": "Bar"}]);
});

friend.put('/api/users/:userid/friends/:friendid', (req, res) => {
  console.log(
      `adding ${req.params.friendid} as a friend of ${req.params.userid}`);
  res.json({"0": {}});
});

friend.delete('/api/users/:userid/friends/:friendid', (req, res) => {
  console.log(`unfriending ${req.params.friendid} and ${req.params.userid}`);
  res.json({"0": {}});
});

friend.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${friend.settings.env}`);
});
