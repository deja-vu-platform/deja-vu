/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

const server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
export const db = new mongodb.Db("feeddb", server, { w: 1 });
db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");

  db.createCollection("subs", (err, subs) => {
    console.log("Resetting subs collection");
    subs.remove((err, remove_count) => {
      if (err) { console.log(err); return; }
      console.log(`Removed ${remove_count} elems`);

      subs.insertMany([
        {name: "Ben", subscriptions: [
          "Software Engineering News", "Things Ben Bitdiddle Says"]},
        {name: "Alyssa", subscriptions: []}
      ], (err, res) => {
        if (err) { console.log(err); return; }
      });
    });
  });

  db.createCollection("pubs", (err, pubs) => {
    console.log("Resetting pubs collection");
    pubs.remove((err, remove_count) => {
      if (err) { console.log(err); return; }
      console.log(`Removed ${remove_count} elems`);

      pubs.insertMany([
        {name: "Software Engineering News", published: [
          "Node v0.0.1 released!"]},
        {name: "Things Ben Bitdiddle Says", published: ["Hi"]},
        {name: "U.S News", published: []},
        {name: "World News", published: []},
        {name: "New Books about Zombies", published: []}
      ], (err, res) => {
        if (err) { console.log(err); return; }
      });
    });
  });
});
