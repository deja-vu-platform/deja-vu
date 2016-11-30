/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";


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
      resources: {"type": "[Resources]"}
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
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

mean.start();
