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
    follows: {
      "type": new graphql.GraphQLList(user_type),
      resolve: user => mean.db.collection("users").find(
          {username: {$in: user.follows}}).toArray()
    },
    potentialFollows: {
      "type": new graphql.GraphQLList(user_type),
      resolve: user => {
        let nin = [user.username];
        if (user.follows !== undefined) {
          nin = nin.concat(user.follows);
        }
        return mean.db.collection("users")
          .find({username: {$nin: nin}}).toArray();
      }
    },
    followed_by: {
      "type": graphql.GraphQLBoolean,
      args: {
        username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
      },
      resolve: (user, {username}) => {
        return Validation.userExists(username)
          .then(_ => {
            return mean.db.collection("users")
              .findOne({
                $and: [{username: username}, {follows: user.username}]
              });
          });
      }
    }
  })
});


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
          return mean.db.collection("users").findOne({username: username});
        }
      },
      users: {
        "type": new graphql.GraphQLList(user_type),
        resolve: (root, _) => {
          console.log(`getting users`);
          return mean.db.collection("users").find().toArray();
        }
      },
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      follow: {
        "type": graphql.GraphQLBoolean,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {username, target}) => Promise.all([
          Validation.userExists(username),
          Validation.userExists(target)
        ]).then(_ => {
          if (username === target) return;
          console.log("all good");
          const users = mean.db.collection("users");
          console.log(`${username} ${target}`);
          return users.updateOne(
            {username: username}, {$addToSet: {follows: target}}).then(
              _ => report_update(username));
        })
      },

      unfollow: {
        "type": graphql.GraphQLBoolean,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {username, target}) => Promise.all([
          Validation.userExists(username),
          Validation.userExists(target)
        ]).then(_ => {
          if (username === target) return;
          console.log("all good");
          const users = mean.db.collection("users");
          console.log(`${username} ${target}`);
          return users.updateOne(
            {username: username}, {$pull: {follows: target}}).then(
              _ => report_update(username));
        })
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


function report_update(username) {
  console.log("reporting update of " + username);
  const users = mean.db.collection("users");
  return users.findOne({username: username}).then(user => {
    console.log(JSON.stringify(user));
    return mean.composer.update_atom("User", user.username, user);
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
      if (debug) {
        console.log("Resetting users collection");
        users.remove((err, remove_count) => {
          if (err) throw err;
          console.log(`Removed ${remove_count} elems`);
          users.insertMany([
            {username: "benbitdiddle", follows: []},
            {username: "alyssaphacker", follows: []},
            {username: "eva", follows: []},
            {username: "louis", follows: []},
            {username: "cydfect", follows: []},
            {username: "lem", follows: []}
          ], (err, res) => { if (err) throw err; });
        });
      }
    });
  }
});
