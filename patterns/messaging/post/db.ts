/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

const server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
export const db = new mongodb.Db("postdb", server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");
  db.createCollection("users", (err, users) => {
    console.log("Resetting users collection");
    users.remove((err, remove_count) => {
        if (err) { console.log(err); return; }
        console.log(`Removed ${remove_count} elems`);
      });
    users.insert([
      {username: "benbitdiddle", posts: []},
      {username: "alyssaphacker", posts: []},
      {username: "eva", posts: []},
      {username: "louis", posts: []},
      {username: "cydfect", posts: []},
      {username: "lem", posts: []}
    ], (err, res) => {
      if (err) { console.log(err); return; }
    });
  });
});
