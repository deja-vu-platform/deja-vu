import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";


const mean = new Mean();

const handlers = {
  source: {
    create: Helpers.resolve_create(mean.db, "source"),
    update: Helpers.resolve_update(mean.db, "source")
  },
  target: {
    create: Helpers.resolve_create(mean.db, "target"),
    update: Helpers.resolve_update(mean.db, "target")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Target",
    fields: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {type: graphql.GraphQLString},
      followedBy: {
        type: graphql.GraphQLBoolean,
        args: {
          source_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (target, {source_id}) => {
          return mean.db.collection("sources")
            .count({
              $and: [
                {atom_id: source_id},
                {follows: {atom_id: target.atom_id}}
              ]
            });
        }
      }
    }
  })
  .add_type({
    name: "Source",
    fields: {
      atom_id: {type: new graphql.GraphQLNonNull(graphql.GraphQLString)},
      follows: {
        type: "[Target]",
        resolve: source => {
          if (source.follows !== undefined) {
            return mean.db.collection("targets")
              .find({atom_id: {$in: source.follows.map(f => f.atom_id)}})
              .toArray()
          } else {
            return [];
          }
        }
      },
      potentialFollows: {
        type: "[Target]",
        resolve: source => {
          let nin = [source.atom_id];
          if (source.follows !== undefined) {
            nin = nin.concat(source.follows.map(f => f.atom_id));
          }
          return mean.db.collection("targets")
            .find({atom_id: {$nin: nin}})
            .toArray();
        }
      }
    }
  })
  .add_mutation({
    name: "follow",
    type: graphql.GraphQLBoolean,
    args: {
      source_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {source_id, target_id}) => {
      const updateObj = {$addToSet: {follows: {atom_id: target_id}}};
      return mean.db.collection("sources")
        .updateOne({atom_id: source_id}, updateObj)
        .then(_ => bus.update_atom("Source", source_id, updateObj));
    }
  })
  .add_mutation({
    name: "unfollow",
    "type": graphql.GraphQLBoolean,
    args: {
      source_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {source_id, target_id}) => {
      const updateObj = {$pull: {follows: {atom_id: target_id}}};
      return mean.db.collection("sources")
        .updateOne({atom_id: source_id}, updateObj)
        .then(_ => bus.update_atom("Source", source_id, updateObj));
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
