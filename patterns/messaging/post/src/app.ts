/// <reference path="../typings/tsd.d.ts" />
//import {Promise} from "es6-promise";
let graphql = require("graphql");
let express_graphql = require("express-graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
let mean_mod = require("mean");


const mean = new mean_mod.Mean("post", (db, debug) => {
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (debug) {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        users.insertMany([
          {username: "benbitdiddle", posts: []},
          {username: "alyssaphacker", posts: []},
          {username: "eva", posts: []},
          {username: "louis", posts: []},
          {username: "cydfect", posts: []},
          {username: "lem", posts: []}
        ], (err, res) => { if (err) throw err; });
      });
    }
  });
});

let post_type = new graphql.GraphQLObjectType({
  name: "Post",
  fields: {
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
  }
});

let user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: {
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    posts: {
      "type": new graphql.GraphQLList(post_type),
      resolve: user => user.posts
    }
  }
});

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
          return mean.db.collection("users").findOne({username: username});
        }
      }
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      newPost: {
        "type": post_type,
        args: {
          author: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {author, content}) => {
          return Validation.user_exists(author)
            .then(_ => {
              return mean.db.collection("users")
                .updateOne(
                  {username: author}, {$push: {posts: {content: content}}});
            });
        }
      }
    }
  })
});

namespace Validation {
  export function user_exists(username) {
    return mean.db.collection("users")
      .findOne({username: username}, {_id: 1})
      .then(user => {
        if (!user) throw new Error(`user ${username} not found`);
        return user;
      });
  }
}

mean.app.use("/graphql", express_graphql({schema: schema, pretty: true}));
