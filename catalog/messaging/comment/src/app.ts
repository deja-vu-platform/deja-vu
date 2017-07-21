import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const uuid = require("uuid");


const mean = new Mean();

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
    fields: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {type: graphql.GraphQLString},
      author: {type: "Author"},
      target: {type: "Target"}
    }
  })
  // Author
  .add_type({
    name: "Author",
    fields: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {type: graphql.GraphQLString}
    }
  })
  // Target
  .add_type({
    name: "Target",
    fields: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)}
    }
  })
  .add_query({
    name: "getComments",
    type: "[Comment]",
    args: {
      author_id: {type: graphql.GraphQLString},
      target_id: {type: graphql.GraphQLString}
    },
    resolve: (_, {author_id, target_id}) => {
      const queryObj = {};
      if (author_id) queryObj["author.atom_id"] = author_id;
      if (target_id) queryObj["target.atom_id"] = target_id;
      return mean.db.collection("comments")
        .find(queryObj)
        .toArray();
    }
  })
  .add_mutation({
    name: "newComment",
    type: "Comment",
    args: {
      author_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {type: graphql.GraphQLString}
    },
    resolve: (_, {author_id, target_id, content}) => {
      const atom_id = uuid.v4();
      const commentObj = {
        atom_id: atom_id,
        author: {atom_id: author_id},
        target: {atom_id: target_id},
        content: content
      };
      return Promise.all([
        mean.db.collection("comments").insertOne(commentObj),
        bus.create_atom("Comment", atom_id, commentObj)
      ])
        .then(() => mean.db.collection("comments").findOne({atom_id: atom_id}));
    }
  })
  .add_mutation({
    name: "editComment",
    type: "Comment",
    args: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {type: graphql.GraphQLString}
    },
    resolve: (_, {atom_id, content}) => {
      return Promise.all([
        mean.db.collection("comments").updateOne({atom_id}, {$set: {content}}),
        bus.update_atom("Comment", atom_id, {$set: {content}})
      ]).then(() => mean.db.collection("comments").findOne({atom_id: atom_id}));
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
