/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";


const mean = new Mean(
  (db, debug) => {
    db.createCollection("users", (err, users) => {
      if (err) throw err;
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} users`);
        if (debug) {
          users.insertMany([
            {username: "benbitdiddle", posts: []},
            {username: "alyssaphacker", posts: []},
            {username: "eva", posts: []},
            {username: "louis", posts: []},
            {username: "cydfect", posts: []},
            {username: "lem", posts: []}
          ], (err, res) => {
            if (err) throw err;
            console.log(`Inserted ${res.insertedCount} users for debug`);
          });
        }
      });
    });

    db.createCollection("posts", (err, posts) => {
      if (err) throw err;
      console.log("Resetting posts collection");
      posts.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} posts`);
      });
    });
  }
);


const handlers = {
  user: {
    create: Helpers.resolve_create(mean.db, "user"),
    update: Helpers.resolve_update(mean.db, "user")
  },
  post: {
    create: Helpers.resolve_create(mean.db, "post"),
    update: Helpers.resolve_update(mean.db, "post")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const post_type = new graphql.GraphQLObjectType({
  name: "Post",
  fields: () => ({
    atom_id: {"type": graphql.GraphQLString},
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    author: {
      "type": new graphql.GraphQLNonNull(user_type),
      resolve: post => mean.db.collection("users")
          .findOne({atom_id: post.author.atom_id})
    }
  })
});

const user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    posts: {
      "type": new graphql.GraphQLList(post_type),
      resolve: user => mean.db.collection("posts")
          .find({atom_id: {$in: user.posts.map(p => p.atom_id)}})
          .toArray()
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      user: {
        "type": user_type,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {username}) => mean.db.collection("users")
          .findOne({username: username})
      },
      post_by_id: {
        "type": post_type,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {atom_id}) => mean.db.collection("posts")
          .findOne({atom_id: atom_id})
      }
    })
  }),
  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      newPost: {
        "type": post_type,
        args: {
          author: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {author, content}) => Validation.user_exists(author)
          .then(user => ({
            atom_id: content,
            content: content,
            author: {atom_id: user.atom_id}
          }))
          .then(post => Promise
            .all([
              mean.db.collection("posts").insertOne(post),
              mean.db.collection("users")
                .updateOne(
                  {atom_id: post.author.atom_id},
                  {$addToSet: {posts: {atom_id: post.atom_id}}}),
              bus.update_atom(
                "User", post.author.atom_id,
                {$addToSet: {posts: {atom_id: post.atom_id}}}),
              bus.create_atom("Post", post.atom_id, post)
              ])
            .then(_ => post))
      }
    })
  })
});

namespace Validation {
  export function user_exists(username) {
    return mean.db.collection("users")
      .findOne({username: username}, {atom_id: 1})
      .then(user => {
        if (!user) throw new Error(`user ${username} not found`);
        return user;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);

mean.start();
