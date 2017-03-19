// import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

// import * as _u from "underscore";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  target: {
      create: Helpers.resolve_create(mean.db, "target"),
      update: Helpers.resolve_update(mean.db, "target")
  },
  source: {
    create: Helpers.resolve_create(mean.db, "source"),
    update: Helpers.resolve_update(mean.db, "source")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Source",
    fields: {
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Target",
    fields: {
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Rating",
    fields: {
      source: {"type": "Source"},
      target: {"type": "Target"},
      rating: {"type": graphql.GraphQLInt}
    }
  })
  .add_query({
    name: "ratingBySourceTarget", // Get rating info by source and target
    type: "Rating",
    args: {
      source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {source, target}) => {
      return mean.db.collection("ratings")
        .findOne({ source: source, target: target });
    }
  })
  .add_mutation({
    name: "updateRating", // Create or modify a rating for a source and target
    type: "Rating",
    args: {
      // These are both atom IDs
      source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      rating: {"type": graphql.GraphQLInt}
    },
    resolve: (_, {source, target, rating}) => {
      return mean.db.collection("ratings")
        .find({ source: source, target: target })
        .toArray()
        .then(res => {
          // If no rating already exists w/ the specified source and target,
          // then we need to make one
          if (res.length === 0) {
            let ratingObject = {
              source: source,
              target: target,
              rating: rating,
              atom_id: uuid.v4(),
            };
            return mean.db.collection("ratings")
              .insertOne(ratingObject)
              .then(_ => bus.create_atom("Rating", rating.atom_id, rating))
              .then(_ => ratingObject);
          } else {
            // If something already exists, we can just return it
            let ratingObject = {
              atom_id: ""
            };
            return mean.db.collection("ratings")
              .updateOne({
                source: source,
                target: target
              }, {
                $set: {
                  rating: rating
                }
              })
              .then(updated => ratingObject = updated)
              .then(_ => bus.update_atom("Rating", ratingObject.atom_id, ratingObject))
              .then(_ => ratingObject);
          }
        });
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    let createSources = () => mean.db.collection("sources")
      .insertOne({
        atom_id: "1"
      }, (err, res) => {
        if (err) throw err;
        console.log("Created sources.");
        createTargets();
      });
    let createTargets = () => mean.db.collection("targets")
      .insertOne({
        atom_id: "1"
      }, (err, res) => {
        if (err) throw err;
        console.log("Created targets.")
      });
    createSources();
  }
  mean.start();
});
