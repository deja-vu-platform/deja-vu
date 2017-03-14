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
    name: "createRating",
    type: "Rating",
    args: {
      // These are both atom IDs
      source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      rating: {"type": graphql.GraphQLInt}
    },
    resolve: (_, {source, target, rating}) => {
      let ratingObject = {
        source: source,
        target: target,
        rating: rating,
        atom_id: uuid.v4(),
      };
      mean.db.collection("ratings")
        .insertOne(ratingObject)
        .then(rating => {
          bus.create_atom("Rating", rating.atom_id, rating);
        });
        console.log("inserted");
        return ratingObject; // TODO: promisify properly

      // TODO
    }
  })
  .schema();

// TODO: Do this more intelligently
// namespace Validation {
//   export function rating_not_found(source, target) {
//     return mean.db.collection("ratings")
//       .find({ source: source, target: target })
//       .count()
//       .then(count => {
//         return count === 0;
//       });
//   }
// }

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
