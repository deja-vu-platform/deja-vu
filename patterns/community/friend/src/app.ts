/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");

let mean;

const user_type = new graphql.GraphQLObjectType({
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
        console.log("query <" +  JSON.stringify(query) + ">");
        return mean.db.collection("users").find(query).toArray();
      }
    }
  })
});

const user_input_type = new graphql.GraphQLInputObjectType({
  name: "UserInput",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    friends: {"type": new graphql.GraphQLList(user_input_type)}
  })
});

/*
const fields = ast => ast.fields.selections.reduce((fields, s) => {
  fields[s.name.value] = 1;
  return fields;
}, {});*/

const schema = new graphql.GraphQLSchema({
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
        "type": graphql.GraphQLBoolean,
        args: {
          u1: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          u2: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mutate_friends("$addToSet")
      },
      unfriend: {
        "type": graphql.GraphQLBoolean,
        args: {
          u1: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          u2: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mutate_friends("$pull")
      },

      _dv_new_user: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, args) => {
          const user = JSON.parse(args.atom);
          console.log("got new user from bus " + JSON.stringify(user));
          user["atom_id"] = args.atom_id;
          return mean.db.collection("users").insertOne(user)
            .then(res => res.insertedCount === 1);
        }
      },
      _dv_update_user: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const user = JSON.parse(args.atom);
          console.log("got up user from bus " + JSON.stringify(user));
          return true;
        }
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
      users.updateOne({username: u1}, update(u2)).then(_ => report_update(u1)),
      users.updateOne({username: u2}, update(u1)).then(_ => report_update(u2))
    ]);
  });
}

function report_update(username) {
  console.log("reporting update of " + username);
  const users = mean.db.collection("users");
  return users.findOne({username: username}).then(user => {
    return mean.composer.update_atom("User", user.atom_id, user);
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


mean = new mean_mod.Mean("friend", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("users", (err, users) => {
      if (err) throw err;
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          users.insertMany([
            {username: "benbitdiddle", friends: []},
            {username: "alyssaphacker", friends: []},
            {username: "eva", friends: []},
            {username: "louis", friends: []},
            {username: "cydfect", friends: []},
            {username: "lem", friends: []}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });
  }
});
