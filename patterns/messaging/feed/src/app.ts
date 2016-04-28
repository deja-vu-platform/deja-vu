/// <reference path="../typings/tsd.d.ts" />
// import {Promise} from "es6-promise";
const graphql = require("graphql");
// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");


const mean = new mean_mod.Mean(
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
      resolve: pub => mean.db.collection("msgs")
        .find({atom_id: {$in: pub.published.map(p => p.atom_id)}})
        .toArray()
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
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      _dv_new_subscriber: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_new("sub")
      },
      _dv_update_subscriber: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_up("sub")
      },

      _dv_new_publisher: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_new("pub")
      },

      _dv_update_publisher: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_up("pub")
      },

      _dv_new_message: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_new("msg")
      },

      _dv_update_message: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_up("msg")
      }
    })
  })
});


mean.serve_schema(schema);
