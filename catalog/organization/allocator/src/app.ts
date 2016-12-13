/// <reference path="../typings/tsd.d.ts" />
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
      consumers: {"type": "[Consumer]"},
      resources: {"type": "[Resource]"}
    }
  })
  .add_type({
    name: "Consumer",
    fields: {
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Resource",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      consumed_by: {
        "type": "Consumer",
        resolve: (resource) => {
          if (resource.consumed_by === undefined) {
            // Trigger round-robin allocation
            return mean.db.collection("allocations")
              .findOne({resources: {atom_id: resource.atom_id}})
              .then(allocation => {
                if (_u.isEmpty(allocation.consumers)) {
                  throw new Error("There are no consumers");
                }

                let consumed_by = "";
                const updates = [];

                let current_consumer_index = 0;
                _u.each(allocation.resources, (r: any) => {
                  const c = allocation.consumers[current_consumer_index];
                  console.log(`Allocating ${r.atom_id} to ${c.atom_id}`)
                  if (r.atom_id === resource.atom_id) {
                    consumed_by = c.atom_id;
                  }
                  updates.push(
                    mean.db.collection("resources")
                      .updateOne({atom_id: r.atom_id},
                                 {$set: {consumed_by: {atom_id: c.atom_id}}}));
                  current_consumer_index = (current_consumer_index + 1) % allocation.consumers.length;
                });
                return Promise.all(updates)
                  .then(_ => mean.db.collection("consumers")
                      .findOne({atom_id: consumed_by}));
              })
          } else {
            return mean.db.collection("consumers")
              .findOne({atom_id: resource.consumed_by});
          }
        }
      }
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
