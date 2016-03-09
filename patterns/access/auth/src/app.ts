/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
// typings don't have the call with no callback
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

import {Mean} from "mean";

let mean;

const user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields:  {
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
  }
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
          // const fields = {username: 1, friends: {username: 1}}; TODO: project
          return mean.db.collection("users").findOne({username: username});
        }
      }
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      register: {
        "type": graphql.GraphQLBoolean,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          password: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {username, password}) => {
          return Validation.userIsNew(username).then(_ => {
            // TODO: promisify
            const hash = bcrypt.hashSync(password, 10);
            const user = {username: username, password: hash};
            return mean.db.collection("users")
              .insertOne(user)
              .then(write_res => {
                if (write_res.insertedCount !== 1) {
                  throw new Error("Couldn't save new user");
                }

                // report
                mean.composer.new_atom("User", username, user);
                return true;
              });
          });
        }
      },
      signIn: {
        "type": graphql.GraphQLString,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          password: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {username, password}) => {
          return Validation.userExists(username).then(user => {
            // TODO: promisify
            if (!bcrypt.compareSync(password, user.password)) {
              throw new Error("Incorrect password");
            }
            const token = jwt.sign(username, "ultra-secret-key");
            return token;
          });
        }
      }
    }
  })
});


namespace Validation {
  export function userExists(username) {
    return mean.db.collection("users")
      .findOne({username: username})
      .then(user => {
        if (!user) throw new Error(`${username} doesn't exist`);
        return user;
      });
  }

  export function userIsNew(username) {
    return mean.db.collection("users")
      .findOne({username: username}, {_id: 1})
      .then(user => {
        if (user) throw new Error(`${username} exists`);
        return user;
      });
  }
}


mean = new Mean("auth", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("users", (err, users) => {
      if (err) throw err;
      if (debug) {
        console.log("Resetting users collection");
        users.remove((err, remove_count) => {
          if (err) throw err;
          console.log(`Removed ${remove_count} elems`);
        });
      }
    });
  }
});
