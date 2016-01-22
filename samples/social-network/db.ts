/// <reference path="typings/mongodb/mongodb.d.ts" />
import * as mongodb from "mongodb";

const server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
export const db = new mongodb.Db("socialnetworkdb", server, { w: 1 });

db.open((err, db) => {
  if (err) { console.log(err); return; }
  console.log("Mongodb started");
});
