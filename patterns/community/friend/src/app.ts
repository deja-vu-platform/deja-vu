/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
let graphql = require("graphql");
let express_graphql = require("express-graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
let mean_mod = require("mean");


const mean = new mean_mod.Mean("friend", (db, debug) => {
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (debug) {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        users.insertMany([
          {username: "benbitdiddle", friends: []},
          {username: "alyssaphacker", friends: []},
          {username: "eva", friends: []},
          {username: "louis", friends: []},
          {username: "cydfect", friends: []},
          {username: "lem", friends: []}
        ], (err, res) => { if (err) throw err; });
      });
    }
  });
});


let user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    friends: {
      "type": new graphql.GraphQLList(user_type),
      resolve: user => mean.db.collection("users").find(
          {username: {$in: user.friends}}).toArray()
    },
    potentialFriends: {
      "type": new graphql.GraphQLList(user_type),
      resolve: ({username}) => {
        console.log(`getting potential friends of ${username}`);
        const query = {
          $and: [
            {friends: {$nin: [username]}},
            {username: {$ne: username}}
          ]};
        return mean.db.collection("users").find(query).toArray();
      }
    }
  })
});

/*
const fields = ast => ast.fields.selections.reduce((fields, s) => {
  fields[s.name.value] = 1;
  return fields;
}, {});*/

let schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      user: {
        "type": user_type,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {username}) => {
          console.log(`getting ${username}`);
          // const fields = {username: 1, friends: {username: 1}}; TODO: project
          return mean.db.collection("users").findOne({username: username});
        }
      }
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      addFriend: {
        "type": user_type,
        args: {
          u1: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          u2: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mutate_friends("$addToSet")
      },
      unfriend: {
        "type": user_type,
        args: {
          u1: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          u2: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mutate_friends("$pull")
      }
    }
  })
});

function mutate_friends(op) {
  return (_, {u1, u2}) => Promise.all([
    Validation.userExists(u1),
    Validation.userExists(u2)
  ]).then(_ => {
    if (u1 === u2) return;
    console.log("all good");
    const update = u => {
      let ret = {};
      ret[op] = {friends: u};
      return ret;
    };
    const users = mean.db.collection("users");
    return Promise.all([
      users.updateOne({username: u1}, update(u2)),
      users.updateOne({username: u2}, update(u1))
    ]);
  });
}

namespace Validation {
  export function userExists(username) {
    return mean.db.collection("users")
      .findOne({username: username}, {_id: 1})
      .then(user => {
        if (!user) throw new Error(`${username} doesn't exist`);
      });
  }
}

mean.app.use("/graphql", express_graphql({schema: schema, pretty: true}));
