/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

var server = new mongodb.Server('localhost', 27017, {auto_reconnect: true})
export var db = new mongodb.Db('frienddb', server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");
  db.createCollection('users', (err, users) => {
    console.log("Reseting existing users collection");
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
