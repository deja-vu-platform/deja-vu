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
  .add_mutation({
    name: "updateRating",
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

// namespace Validation {
//   /**
//    * Verify a rating of the specified target exists from the specified source.
//    * If no rating exists, then one is created.
//   */
//   export function verifyRatingExists(source, target) {
//     return mean.db.collection("ratings")
//       .findOne({ source: source, target: target })
//       .then(rating => {
//         if (!rating) {
//           // Create
//           mean.db.collection("ratings")

//         }
//         return rating;
//       });
//   }
// }

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
