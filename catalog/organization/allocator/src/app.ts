import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const mean = new Mean();


const handlers = {
  allocation: {
    create: Helpers.resolve_create(mean.db, "allocation"),
    update: Helpers.resolve_update(mean.db, "allocation")
  },
  consumer: {
    create: Helpers.resolve_create(mean.db, "consumer"),
    update: Helpers.resolve_update(mean.db, "consumer")
  },
  resource: {
    create: Helpers.resolve_create(mean.db, "resource"),
    update: Helpers.resolve_update(mean.db, "resource")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Allocation",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      resources: {"type": "[Resource]"}
    }
  })
  .add_type({
    name: "Consumer",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    }
  })
  .add_type({
    name: "Resource",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      assigned_to: {
        "type": "Consumer",
        resolve: (resource) => {
          if (resource.assigned_to === undefined) {
            // todo: need to lock until this is done
            // Trigger round-robin allocation
            return mean.db.collection("allocations")
              .findOne({resources: {atom_id: resource.atom_id}})
              .then(allocation => mean.db.collection("consumers")
                .find()
                .toArray()
                .then(consumers => {
                  let assigned_to = "";
                  const updates = [];

                  let current_consumer_index = 0;
                  _u.each(allocation.resources, (r: any) => {
                    const c = consumers[current_consumer_index];
                    console.log(`Allocating ${r.atom_id} to ${c.atom_id}`)
                    if (r.atom_id === resource.atom_id) {
                      assigned_to = c.atom_id;
                    }
                    updates.push(
                      mean.db.collection("resources")
                        .updateOne({atom_id: r.atom_id},
                                   {$set: {assigned_to: {atom_id: c.atom_id}}}));
                    current_consumer_index = (
                      current_consumer_index + 1) % consumers.length;
                  });
                return Promise.all(updates)
                  .then(_ => mean.db.collection("consumers")
                      .findOne({atom_id: assigned_to}));
              }));
          } else {
            return mean.db.collection("consumers")
              .findOne({atom_id: resource.assigned_to.atom_id});
          }
        }
      }
    }
  })
  .add_mutation({
    name: 'editChampion',
    type: graphql.GraphQLBoolean,
    args: {
      resource_atom_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      champion_atom_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
    resolve: (_, {resource_atom_id, champion_atom_id}) => Promise
      .all([
        Validation.resourceExists(resource_atom_id),
        Validation.consumerExists(champion_atom_id)
      ])
      .then(consumer => {
        let updateOp = { $set: { "assigned_to.atom_id": champion_atom_id } };
        return mean.db.collection("resources")
          .updateOne(
            { atom_id: resource_atom_id },
            updateOp,
        )
        .then(_ => bus.update_atom("Resource", resource_atom_id, updateOp))
        .then(_ => true);
    })
  })
  .schema();

namespace Validation {
  export function resourceExists(resource_atom_id) {
    return mean.db.collection("resources")
      .findOne({ atom_id: resource_atom_id })
      .then(resource => {
        if (!resource) {
          throw new Error(`Resource ${resource_atom_id} not found`);
        }
        return resource;
      })
  }

  export function consumerExists(champion_atom_id) {
    return mean.db.collection("consumers")
      .findOne({ atom_id: champion_atom_id })
      .then(consumer => {
        if (!consumer) {
          throw new Error(`Consumer ${champion_atom_id} not found`);
        }
        return consumer;
      })
  }
}

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
