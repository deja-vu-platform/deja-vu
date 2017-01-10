import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");


const mean = new Mean();

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

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Post",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      author: {"type": "User"}
    }
  })
  .add_type({
    name: "User",
    fields: {
      username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      posts: {"type": "[Post]"}
    }
  })
  .add_query({
    name: "user",
    "type": "User",
    args: {
      username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {username}) => mean.db.collection("users")
      .findOne({username: username})
  })
  .add_mutation({
    name: "newPost",
    "type": "Post",
    args: {
      author: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {author, content}) => Validation.user_exists(author)
      .then(user => ({
        atom_id: uuid.v4(),
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
   
    })
  .schema();


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

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("users").insertMany([
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
  mean.start();
});
