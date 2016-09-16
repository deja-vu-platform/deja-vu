/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";


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

const comment_type = new graphql.GraphQLObjectType({
  name: "Comment",
  fields: () => ({
    atom_id: {"type": graphql.GraphQLString},
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    author: {
      "type": author_type,
      resolve: comment => mean.db.collection("authors").
        find({atom_id: comment.author.atom_id})
    }
  })
});

const author_type = new graphql.GraphQLObjectType({
  name: "author",
  fields: () => ({
    atom_id: {"type": graphql.GraphQLString},
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
  })
});

const target_type = new graphql.GraphQLObjectType({
  name: "Target",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    comments: {
      "type": new graphql.GraphQLList(comment_type),
      resolve: target => mean.db.collection("comments")
          .find({atom_id: {$in: target.comments.map(p => p.atom_id)}})
          .toArray()
    },
    newComment: {
      "type": graphql.GraphQLBoolean,
      args: {
        author_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
      },
      resolve: (target, {author_id, content}) => {
        const atom_id = "foo";
        return Validation.author_exists(author_id)
          .then(author => Promise.all([
              mean.db.collection("comments").insertOne({
                atom_id: atom_id,
                content: content,
                author: {atom_id: author.atom_id}
              }),
              mean.db.collection("targets")
                .updateOne(
                  {atom_id: target.atom_id},
                  {$addToSet: {comments: {atom_id: atom_id}}}),
              bus.create_atom("Comment", atom_id, {
                atom_id: atom_id,
                content: content,
                author: author.atom_id
              }),
              bus.update_atom(
                "Target", target.atom_id,
                {$addToSet: {comments: {atom_id: atom_id}}})
              ])
          .then(_ => true));
      }
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      target_by_id: {
        "type": target_type,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {atom_id}) => mean.db
          .collection("targets").findOne({atom_id: atom_id})
      }
    })
  })
});

namespace Validation {
  export function author_exists(atom_id) {
    return mean.db.collection("authors")
      .findOne({atom_id: atom_id}, {atom_id: 1})
      .then(author => {
        if (!author) throw new Error(`author of id ${atom_id} not found`);
        return author;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);

mean.start();
