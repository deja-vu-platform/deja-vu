const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

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
      rating: {"type": graphql.GraphQLInt},
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_query({
    name: "ratingBySourceTarget", // Get rating info by source and target
    type: "Rating",
    args: {
      source_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {source_id, target_id}) => {
      return mean.db.collection("ratings")
        .findOne({ "source.atom_id": source_id, "target.atom_id": target_id });
    }
  })
  .add_query({
    name: "averageRatingForTarget", // Get average rating for a certain target
    type: graphql.GraphQLFloat,
    args: {
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {target_id}) => {
      return mean.db.collection("ratings")
        .find({ "target.atom_id": target_id })
        .toArray()
        .then(res => res.reduce(
          // Sum over all the values, adjusting each for the number of results
          (prev, current) => prev + (current.rating / res.length),
          0)
        );
    }
  })
  .add_query({
    name: "ratingCountForTarget", // Number of times target has been rated
    type: graphql.GraphQLInt,
    args: {
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {target_id}) => {
      return mean.db.collection("ratings")
        .find({ "target.atom_id": target_id })
        .count();
    }
  })
  .add_query({
    name: "ratingsByTarget",
    type: "[Rating]",
    args: {
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {target_id}) => {
      return mean.db.collection("ratings")
        .find({"target.atom_id": target_id})
        .toArray();
    }
  })
  .add_query({
    name: "ratingsBySource",
    type: "[Rating]",
    args: {
      source_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (_, {source_id}) => {
      return mean.db.collection("ratings")
        .find({"source.atom_id": source_id})
        .toArray();
    }
  })
  .add_mutation({
    name: "updateRating", // Create or modify a rating for a source and target
    type: "Rating",
    args: {
      // These are both atom IDs
      source_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      rating: {"type": graphql.GraphQLInt}
    },
    resolve: (_, {source_id, target_id, rating}) => {
      return mean.db.collection("ratings")
        .find({ "source.atom_id": source_id, "target.atom_id": target_id })
        .toArray()
        .then(res => {
          // If no rating already exists w/ the specified source and target,
          // then we need to make one
          if (res.length === 0) {
            let ratingObject = {
              source: {atom_id: source_id},
              target: {atom_id: target_id},
              rating: rating,
              atom_id: uuid.v4()
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
                "source.atom_id": source_id,
                "target.atom_id": target_id
              }, {
                $set: {
                  rating: rating
                }
              })
              .then(updated => ratingObject = updated)
              .then(_ => bus.update_atom("Rating", ratingObject.atom_id,
                ratingObject))
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
      .insertMany([
        {
          atom_id: "1"
        },
        {
          atom_id: "2"
        }
      ], (err, res) => {
        if (err) throw err;
        console.log("Created sources.");
        createTargets();
      });
    let createTargets = () => mean.db.collection("targets")
      .insertMany([
        {
          atom_id: "1"
        },
        {
          atom_id: "2"
        }
      ], (err, res) => {
        if (err) throw err;
        console.log("Created targets.");
        createRatings();
      });
    let createRatings = () => mean.db.collection("ratings")
      .insertOne({
        source: "2",
        target: "1",
        rating: 4
      }, (err, res) => {
        if (err) throw err;
        console.log("Created ratings.");
      })
    createSources();
  }
  mean.start();
});
