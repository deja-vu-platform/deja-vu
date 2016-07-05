/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean, ServerBus, Helpers} from "mean";


const mean = new Mean(
  "friend",
  (db, debug) => {
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
);

const handlers = {
  user: {
    create: Helpers.resolve_create(mean.db, "user"),
    update: Helpers.resolve_update(mean.db, "user")
  }
};

const bus = new ServerBus(
    "post", mean.loc, mean.ws, mean.bushost, mean.busport, handlers);


//////////////////////////////////////////////////



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
    fields: () => ({
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
    })
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      addFriend: {
        "type": graphql.GraphQLBoolean,
        args: {
          username1: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          },
          username2: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          }
        },
        resolve: mutate_friends("$addToSet")
      },
      unfriend: {
        "type": graphql.GraphQLBoolean,
        args: {
          username1: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          },
          username2: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          }
        },
        resolve: mutate_friends("$pull")
      }
    })
  })
});

function mutate_friends(op) {
  return (_, {username1, username2}) => Promise.all([
    Validation.userExists(username1), Validation.userExists(username2)
  ]).then(users => {
    if (username1 === username2) return;
    const update = u => {
      let ret = {};
      ret[op] = {friends: u};
      return ret;
    };
    const u1 = users[0];
    const u2 = users[1];
    const users_col = mean.db.collection("users");
    return Promise.all([
      users_col.updateOne({username: username1}, update(u2))
          .then(_ => bus.update_atom(user_type, u1.atom_id, update(u2))),
      users_col.updateOne({username: username2}, update(u1))
          .then(_ => bus.update_atom(user_type, u2.atom_id, update(u1)))
    ]);
  });
}


namespace Validation {
  export function userExists(username) {
    return mean.db.collection("users")
      .findOne({username: username}, {atom_id: 1})
      .then(user => {
        if (!user) throw new Error(`${username} doesn't exist`);
        return user;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);
