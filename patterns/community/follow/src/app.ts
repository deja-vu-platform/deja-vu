/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";


const mean = new Mean(
  "follow",
  (db, debug) => {
    db.createCollection("sources", (err, sources) => {
      if (err) throw err;
      console.log("Resetting sources collection");
      sources.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          sources.insertMany([
            {atom_id: "benbitdiddle", name: "benbitdiddle", follows: []},
            {atom_id: "alyssaphacker", name: "alyssaphacker", follows: []},
            {atom_id: "eva", name: "eva", follows: []},
            {atom_id: "louis", name: "louis", follows: []},
            {atom_id: "cydfect", name: "cydfect", follows: []},
            {atom_id: "lem", name: "lem", follows: []}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });

    db.createCollection("targets", (err, sources) => {
      if (err) throw err;
      console.log("Resetting targets collection");
      sources.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          sources.insertMany([
            {atom_id: "benbitdiddle", name: "benbitdiddle"},
            {atom_id: "alyssaphacker", name: "alyssaphacker"},
            {atom_id: "eva", name: "eva"},
            {atom_id: "louis", name: "louis"},
            {atom_id: "cydfect", name: "cydfect"},
            {atom_id: "lem", name: "lem"}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });
  }
);

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
    "follow", mean.loc, mean.ws, mean.bushost, mean.busport, handlers);


//////////////////////////////////////////////////


const target_type = new graphql.GraphQLObjectType({
  name: "Target",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    followed_by: {
      "type": graphql.GraphQLBoolean,
      args: {
        name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
      },
      resolve: (target, {name}) => Validation.sourceExists(name)
          .then(_ => mean.db.collection("sources")
            .count({
              $and: [{name: name}, {follows: {atom_id: target.atom_id}}
              ]}))
    }
  })
});


const source_type = new graphql.GraphQLObjectType({
  name: "Source",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    follows: {
      "type": new graphql.GraphQLList(target_type),
      resolve: source => mean.db.collection("targets")
        .find({atom_id: {$in: source.follows.map(f => f.atom_id)}}).toArray()
    },
    potentialFollows: {
      "type": new graphql.GraphQLList(target_type),
      resolve: source => {
        let nin = [source.atom_id];
        if (source.follows !== undefined) {
          nin = nin.concat(source.follows.map(f => f.atom_id));
        }
        return mean.db.collection("targets")
          .find({atom_id: {$nin: nin}}).toArray();
      }
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      source: {
        "type": source_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {name}) => Validation.sourceExists(name)
      },
      sources: {
        "type": new graphql.GraphQLList(source_type),
        resolve: (root, _) => {
          console.log(`getting sources`);
          return mean.db.collection("sources").find().toArray();
        }
      },
      targets: {
        "type": new graphql.GraphQLList(target_type),
        resolve: (root, _) => {
          console.log(`getting targets`);
          return mean.db.collection("targets").find().toArray();
        }
      }
    })
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      follow: {
        "type": graphql.GraphQLBoolean,
        args: {
          source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: update("$addToSet")
      },

      unfollow: {
        "type": graphql.GraphQLBoolean,
        args: {
          source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: update("$pull")
      }
    })
  })
});


function update(op) {
  return (_, {source, target}) => Promise.all([
      Validation.sourceExists(source), Validation.targetExists(target)
      ]).then(val_info => {
        console.log(`doing update of ${source} ${target}`);
        if (source === target) return;
        const s = val_info[0];
        const t = val_info[1];
        console.log(`got ${JSON.stringify(s)} ${JSON.stringify(t)}`);

        const update_op = t => {
          const ret = {};
          ret[op] = {follows: {atom_id: t.atom_id}};
          return ret;
        };
        return mean.db.collection("sources")
          .updateOne({atom_id: s.atom_id}, update_op(t))
          .then(_ => bus.update_atom(source_type, s.atom_id, update_op(t)));
      });
}

namespace Validation {
  export function sourceExists(name) {
    return _exists(name, "sources");
  }

  export function targetExists(name) {
    return _exists(name, "targets");
  }

  function _exists(name, col) {
    return mean.db.collection(col)
      .findOne({name: name}, {atom_id: 1})
      .then(source => {
        if (!source) throw new Error(`${name} doesn't exist`);
        return source;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);
