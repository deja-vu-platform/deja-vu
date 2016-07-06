/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");

import {Mean} from "mean";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";


const mean = new Mean(
  "feed",
  (db, debug) => {
    // Subs
    db.createCollection("subs", (err, subs) => {
      if (err) throw err;
      subs.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          subs.insertMany([
            {name: "Ben", subscriptions: [
              "Software Engineering News", "Things Ben Bitdiddle Says"]},
            {name: "Alyssa", subscriptions: []}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });
    // Pubs
    db.createCollection("pubs", (err, pubs) => {
      if (err) throw err;
      pubs.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          pubs.insertMany([
            {name: "Software Engineering News", published: [
              "Node v0.0.1 released!"]},
            {name: "Things Ben Bitdiddle Says", published: ["Hi"]},
            {name: "U.S News", published: []},
            {name: "World News", published: []},
            {name: "New Books about Zombies", published: []}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });
    // Messages
    db.createCollection("msgs", (err, pubs) => {
      if (err) throw err;
      pubs.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          //
        }
      });
    });
  }
);


const handlers = {
  publisher: {
    create: Helpers.resolve_create(mean.db, "pub"),
    update: Helpers.resolve_update(mean.db, "pub")
  },
  subscriber: {
    create: Helpers.resolve_create(mean.db, "sub"),
    update: Helpers.resolve_update(mean.db, "sub")
  },
  message: {
    create: Helpers.resolve_create(mean.db, "msg"),
    update: Helpers.resolve_update(mean.db, "msg")
  }
};

new ServerBus(
    "feed", mean.loc, mean.ws, mean.bushost, mean.busport, handlers);


/////////////////////

const msg_type = new graphql.GraphQLObjectType({
  name: "Message",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    content: {"type": graphql.GraphQLString}
  })
});

const pub_type = new graphql.GraphQLObjectType({
  name: "Publisher",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    published: {
      "type": new graphql.GraphQLList(msg_type),
      resolve: pub => {
        if (!pub.published) return [];
        return mean.db.collection("msgs")
          .find({atom_id: {$in: pub.published.map(p => p.atom_id)}})
          .toArray();
      }
    }
  })
});

const sub_type = new graphql.GraphQLObjectType({
  name: "Subscriber",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    subscriptions: {
      "type": new graphql.GraphQLList(pub_type),
      resolve: sub => mean.db.collection("pubs")
        .find({atom_id: {$in: sub.subscriptions.map(s => s.atom_id)}})
        .toArray()
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      sub: {
        "type": sub_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {name}) => {
          console.log(`getting ${name}`);
          return mean.db.collection("subs").find({name: name}).limit(1).next();
        }
      }
    })
  })
});


Helpers.serve_schema(mean.ws, schema);
