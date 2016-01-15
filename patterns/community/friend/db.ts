/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

const server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
export const db = new mongodb.Db("frienddb", server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");
  db.createCollection("users", (err, users) => {
    console.log("Resetting users collection");
    users.remove((err, remove_count) => {
      if (err) { console.log(err); return; }
      console.log(`Removed ${remove_count} elems`);
      users.insertMany([
        {username: "benbitdiddle", friends: []},
        {username: "alyssaphacker", friends: []},
        {username: "eva", friends: []},
        {username: "louis", friends: []},
        {username: "cydfect", friends: []},
        {username: "lem", friends: []}
      ], (err, res) => {
        if (err) { console.log(err); return; }
      });
    });
  });
});
