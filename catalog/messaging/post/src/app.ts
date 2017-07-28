const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid: { v4: () => string } = require("uuid");


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

const grafo = new Grafo(mean.db, Helpers.on_read(bus));

const schema = grafo
  .add_type({
    name: "Post",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {"type": graphql.GraphQLString},
      author: {"type": "User"}
    }
  })
  .add_type({
    name: "User",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      username: {"type": graphql.GraphQLString}
    }
  })
  .add_query({
    name: "postsByAuthor",
    type: "[Post]",
    args: {
      author_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {author_id}) => {
      return mean.db.collection("posts")
        .find({"author.atom_id": author_id})
        .toArray();
    }
  })
  .add_mutation({
    name: "newPost",
    "type": "Post",
    args: {
      author_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {"type": graphql.GraphQLString}
    },
    resolve: (_, {author_id, content}) => {
      const post = {
        atom_id: uuid.v4(),
        content: content,
        author: {atom_id: author_id}
      };
      return mean.db.collection("posts").insertOne(post)
        .then(_ => bus.create_atom("Post", post.atom_id, post))
        .then(_ => post);
    }
  })
  .add_mutation({
    name: "editPost",
    type: "Post",
    args: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      author_id: {type: graphql.GraphQLString},
      content: {type: graphql.GraphQLString}
    },
    resolve: (_, {atom_id, author_id, content}) => {
      const updateObj = {content: content};
      if (author_id) updateObj["author.atom_id"] = author_id;
      return Promise
        .all([
          mean.db.collection("posts").updateOne(
            {atom_id: atom_id}, {$set: updateObj}
          ),
          bus.update_atom("Post", atom_id, {$set: updateObj})
        ])
        .then(() => mean.db.collection("posts").findOne({atom_id}))
    }
  })
  .schema();


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
