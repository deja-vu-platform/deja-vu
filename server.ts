/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as express from "express";
import * as mongodb from "mongodb";

var server = new mongodb.Server('localhost', 27017, {auto_reconnect: true})
var db = new mongodb.Db('frienddb', server, { w: 1 });
db.open((err, db) => {
  console.log("Mongodb started");
});


var friend = express();

friend.use(express.static(__dirname));
friend.get('/users', (req, res) => {
  console.log("getting all users");
  res.json({});
});
friend.get('/users/:userid/friends', (req, res) => {
  console.log(`getting friends of ${req.params.userid}`);
  res.json({});
});

friend.put('/users/:userid/friends/:friendid', (req, res) => {
  console.log(
      `adding ${req.params.friendid} as a friend of ${req.params.userid}`);
  res.json({});
});

friend.delete('/users/:userid/friends/:friendid', (req, res) => {
  console.log(`unfriending ${req.params.friendid} and ${req.params.userid}`);
  res.json({});
});

friend.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${friend.settings.env}`);
});
