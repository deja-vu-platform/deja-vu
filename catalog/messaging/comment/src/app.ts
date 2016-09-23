/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";


const mean = new Mean(
  (db, debug) => {
    db.createCollection("comments", (err, comments) => {
      if (err) throw err;
      console.log("Resetting comments collection");
      comments.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} comments`);
      });
    });

    db.createCollection("targets", (err, targets) => {
      if (err) throw err;
      console.log("Resetting targets collection");
      targets.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} targets`);
      });
    });

    db.createCollection("authors", (err, authors) => {
      if (err) throw err;
      console.log("Resetting authors collection");
      authors.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} authors`);
      });
    });
  }
);


const handlers = {
  comment: {
    create: Helpers.resolve_create(mean.db, "comment"),
    update: Helpers.resolve_update(mean.db, "comment")
  },
  target: {
    create: Helpers.resolve_create(mean.db, "target"),
    update: Helpers.resolve_update(mean.db, "target")
  },
  author: {
    create: Helpers.resolve_create(mean.db, "author"),
    update: Helpers.resolve_update(mean.db, "author")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  // Comment
  .add_type({
    name: "Comment",
    fields: () => ({
      atom_id: {"type": graphql.GraphQLString},
      content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      author: {"type": "Author"}
    })
  })
  // Author
  .add_type({
    name: "Author",
    fields: () => ({
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    })
  })
  // Target
  .add_type({
    name: "Target",
    fields: () => ({
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      comments: {"type": "[Comment]"},
      newComment: {
        "type": "Comment",
        args: {
          author: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (target, {author, content}) => {
          const atom_id = "foo";
          return Validation.author_exists(author)
            .then(author => ({
               atom_id: atom_id,
               content: content,
               author: {atom_id: author.atom_id}
            }))
            .then(comment => Promise.all([
                mean.db.collection("comments").insertOne(comment),
                mean.db.collection("targets")
                  .updateOne(
                    {atom_id: target.atom_id},
                    {$addToSet: {comments: {atom_id: atom_id}}}),
                bus.create_atom("Comment", atom_id, comment),
                bus.update_atom(
                  "Target", target.atom_id,
                  {$addToSet: {comments: {atom_id: atom_id}}})
                ]).then(_ => comment));
        }
      }
    })
  })
  .add_type({
    name: "Query",
    fields: () => ({
      target_by_id: {
        "type": "Target",
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {atom_id}) => mean.db
          .collection("targets").findOne({atom_id: atom_id})
     }
    })
  })
  .schema();


namespace Validation {
  export function author_exists(name) {
    return mean.db.collection("authors")
      .findOne({name: name}, {atom_id: 1})
      .then(author => {
        if (!author) throw new Error(`author of name ${name} not found`);
        return author;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);

mean.start();
