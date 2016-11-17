/// <reference path="../typings/tsd.d.ts" />
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
    }
  })
  .add_type({
    name: "Source",
    fields: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      follows: {
        "type": "[Target]",
        resolve: source => mean.db.collection("targets")
          .find({atom_id: {$in: source.follows.map(f => f.atom_id)}}).toArray()
      },
      potentialFollows: {
        "type": "[Target]",
        resolve: source => {
          let nin = [source.atom_id];
          if (source.follows !== undefined) {
            nin = nin.concat(source.follows.map(f => f.atom_id));
          }
          return mean.db.collection("targets")
            .find({atom_id: {$nin: nin}}).toArray();
        }
      }
    }
  })
  .add_query({
    name: "source",
    "type": "Source",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {name}) => Validation.sourceExists(name)
  })
  .add_query({
    name: "sources",
    "type": "[Source]",
    resolve: (root, _) => {
      console.log(`getting sources`);
      return mean.db.collection("sources").find().toArray();
    }
  })
  .add_query({
    name: "targets",
    "type": "[Target]",
    resolve: (root, _) => {
      console.log(`getting targets`);
      return mean.db.collection("targets").find().toArray();
    }
  })
  .add_mutation({
    name: "follow",
    "type": graphql.GraphQLBoolean,
    args: {
      source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: update("$addToSet")
  })
  .add_mutation({
    name: "unfollow",
    "type": graphql.GraphQLBoolean,
    args: {
      source: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      target: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: update("$pull")
  })
  .schema();


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
          .then(_ => bus.update_atom("Source", s.atom_id, update_op(t)));
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

grafo.init().then(_ => mean.start());
