/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

const server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
export const db = new mongodb.Db("feeddb", server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");

  db.createCollection("subscribers", (err, subs) => {
    console.log("Reseting existing subscribers collection");
    subs.remove((err, remove_count) => {
        if (err) { console.log(err); return; }
        console.log(`Removed ${remove_count} elems`);
      });
    subs.insert([
      {name: "Ben", subscriptions: ["Software Engineering News", "Things Ben Bitdiddle Says"]},
      {name: "Alyssa", subscriptions: []}
    ], (err, res) => {
      if (err) { console.log(err); return; }
    });
  });

  db.createCollection("publisher", (err, pubs) => {
    console.log("Reseting existing publishers collection");
    pubs.remove((err, remove_count) => {
        if (err) { console.log(err); return; }
        console.log(`Removed ${remove_count} elems`);
      });
    pubs.insert([
      {name: "Software Engineering News", published: ["Node v0.0.1 released!"]},
      {name: "Things Ben Bitdiddle says", published: ["Well, hi"]},
      {name: "U.S News", published: []},
      {name: "World News", published: []},
      {name: "New Books about Zombies", published: []},
    ], (err, res) => {
      if (err) { console.log(err); return; }
    });
  });
});
