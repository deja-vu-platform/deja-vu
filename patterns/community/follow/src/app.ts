/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");

let mean;


const target_type = new graphql.GraphQLObjectType({
  name: "Target",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    followed_by: {
      "type": graphql.GraphQLBoolean,
      args: {
        name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
      },
      resolve: (target, {name}) => {
        return Validation.sourceExists(name)
          .then(_ => {
            return mean.db.collection("sources")
              .findOne({
                $and: [{name: name}, {"follows.name": target.name}]
              });
          });
      }
    }
  })
});


const source_type = new graphql.GraphQLObjectType({
  name: "Source",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    follows: {
      "type": new graphql.GraphQLList(target_type),
      resolve: source => mean.db.collection("sources").find(
          {name: {$in: source.follows}}).toArray()
    },
    potentialFollows: {
      "type": new graphql.GraphQLList(target_type),
      resolve: source => {
        let nin = [source.name];
        if (source.follows !== undefined) {
          nin = nin.concat(source.follows);
        }
        return mean.db.collection("sources")
          .find({name: {$nin: nin}}).toArray();
      }
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      source: {
        "type": source_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {name}) => {
          console.log(`getting ${name}`);
          return mean.db.collection("sources").findOne({name: name});
        }
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
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      follow: {
        "type": graphql.GraphQLBoolean,
        args: {
          source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {source, target}) => Promise.all([
          Validation.sourceExists(source),
          Validation.targetExists(target)
        ]).then(_ => {
          if (source === target) return;
          console.log(`${source} ${target}`);
          return mean.db.collection("targets")
            .findOne({name: target})
            .then(target => mean.db.collection("sources")
              .updateOne({name: source}, {$addToSet: {follows: target}})
              .then(_ => report_update(source)));
        })
      },

      unfollow: {
        "type": graphql.GraphQLBoolean,
        args: {
          source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (_, {source, target}) => Promise.all([
          Validation.sourceExists(source),
          Validation.targetExists(target)
        ]).then(_ => {
          if (source === target) return;
          console.log(`${source} ${target}`);
          return mean.db.collection("targets")
            .findOne({name: target})
            .then(target => mean.db.collection("sources")
              .updateOne({name: source}, {$pull: {follows: target}})
              .then(_ => report_update(source)));
        })
      },

      _dv_new_source: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, args) => {
          const source = JSON.parse(args.atom);
          console.log(
            "got new source (id " + args.atom_id + ") from bus " +
            JSON.stringify(source));
          source["atom_id"] = args.atom_id;
          return mean.db.collection("sources").insertOne(source)
            .then(res => res.insertedCount === 1);
        }
      },
      _dv_update_source: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const source = JSON.parse(args.atom);
          console.log(
            "got update source (id" + args.atom_id + ") from bus " +
            JSON.stringify(source));
          return mean.db.collection("sources").replaceOne(
            {atom_id: args.atom_id}, source)
            .then(res => res.modifiedCount === 1);
        }
      },

      _dv_new_target: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, args) => {
          const target = JSON.parse(args.atom);
          console.log(
            "got new target (id " + args.atom_id + ") from bus " +
            JSON.stringify(target));
          target["atom_id"] = args.atom_id;
          return mean.db.collection("targets").insertOne(target)
            .then(res => res.insertedCount === 1);
        }
      },

      _dv_update_target: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const target = JSON.parse(args.atom);
          console.log(
            "got update target (id " + args.atom_id + ") from bus " +
            JSON.stringify(target));
          return mean.db.collection("targets").replaceOne(
            {atom_id: args.atom_id}, target)
            .then(res => res.modifiedCount === 1);
        }
      },
    }
  })
});


function report_update(name) {
  console.log("reporting update of " + name);
  const sources = mean.db.collection("sources");
  return sources.findOne({name: name}).then(source => {
    console.log(JSON.stringify(source));
    return mean.composer.update_atom(source_type, source.atom_id, source);
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
      .findOne({name: name}, {_id: 1})
      .then(source => {
        if (!source) throw new Error(`${name} doesn't exist`);
      });
  }
}


mean = new mean_mod.Mean("follow", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("sources", (err, sources) => {
      if (err) throw err;
        console.log("Resetting sources collection");
        sources.remove((err, remove_count) => {
          if (err) throw err;
          console.log(`Removed ${remove_count} elems`);
          if (debug) {
            sources.insertMany([
              {name: "benbitdiddle", follows: []},
              {name: "alyssaphacker", follows: []},
              {name: "eva", follows: []},
              {name: "louis", follows: []},
              {name: "cydfect", follows: []},
              {name: "lem", follows: []}
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
            {name: "benbitdiddle"},
            {name: "alyssaphacker"},
            {name: "eva"},
            {name: "louis"},
            {name: "cydfect"},
            {name: "lem"}
          ], (err, res) => { if (err) throw err; });
        }
      });
    });
  }
});
