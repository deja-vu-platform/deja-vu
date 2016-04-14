/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean";

let mean;


const post_type = new graphql.GraphQLObjectType({
  name: "Post",
  fields: {
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
  }
});

const user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: {
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    posts: {
      "type": new graphql.GraphQLList(post_type),
      resolve: user => {
        let promises = user.posts.map(p => {
          return mean.db.collections("posts").find({atom_id: p.atom_id});
        });
        return Promise.all(promises);
      }
    }
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
          const post = {atom_id: content, content: content};
          return Validation.user_exists(author)
            .then(_ => {
              return Promise.all([
                mean.db.collection("users")
                  .updateOne(
                    {username: author}, {$push: {posts: post}}),
                mean.db.collection("posts")
                  .insertOne(post)
                  ]);
            })
            .then(_ => {
              // report
              return mean.db.collection("users")
                .findOne({username: author})
                .then(updated_user => {
                  mean.composer.update_atom(
                    "User", updated_user.atom_id, updated_user);
                  mean.composer.new_atom("Post", post.atom_id, post);
                });
            });
        }
      },

      _dv_new_user: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const user = JSON.parse(args.atom);
          console.log(
            "got new user (id" + args.atom_id + ") from bus " +
             JSON.stringify(user));
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
          console.log(
            "got update user (id " + args.atom_id + ") from bus " +
            JSON.stringify(user));
          return mean.db.collection("users").replaceOne(
            {atom_id: args.atom_id}, user)
            .then(res => res.modifiedCount === 1);
        }
      },

      _dv_new_post: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const post = JSON.parse(args.atom);

          console.log("got new post from bus " + JSON.stringify(post));
          post["atom_id"] = args.atom_id;
          return mean.db.collection("posts").insertOne(post)
            .then(res => res.insertedCount === 1);
        }
      },

      _dv_update_post: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const post = JSON.parse(args.atom);
          console.log(
            "got update post (id " + args.atom_id + ") from bus " +
            JSON.stringify(post));
          return mean.db.collection("posts").replaceOne(
            {atom_id: args.atom_id}, post)
            .then(res => res.modifiedCount === 1);
        }
      },
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


mean = new Mean("post", {
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
            {username: "benbitdiddle", posts: []},
            {username: "alyssaphacker", posts: []},
            {username: "eva", posts: []},
            {username: "louis", posts: []},
            {username: "cydfect", posts: []},
            {username: "lem", posts: []}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });

    db.createCollection("posts", (err, posts) => {
      if (err) throw err;
      console.log("Resetting posts collection");
      posts.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
      });
    });
  }
});
