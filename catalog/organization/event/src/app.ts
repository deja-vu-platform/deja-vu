/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";


const mean = new Mean();


const handlers = {
  "event": {
    create: Helpers.resolve_create(mean.db, "event"),
    update: Helpers.resolve_update(mean.db, "event")
  },
  "weekly_event": {
    create: Helpers.resolve_create(mean.db, "weekly_event"),
    update: Helpers.resolve_update(mean.db, "weekly_event")
  },
  description: {
    create: Helpers.resolve_create(mean.db, "description"),
    update: Helpers.resolve_update(mean.db, "description")
  },
  guest: {
    create: Helpers.resolve_create(mean.db, "guest"),
    update: Helpers.resolve_update(mean.db, "guest")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Event",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      // todo: grafo should allow weak types
      date: {"type": graphql.GraphQLString},
      start_time: {"type": graphql.GraphQLString},
      end_time: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "WeeklyEvent",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      events: {"type": "[Event]"}
    }
  })
  .add_query({
    name: "newWeeklyEvent",
    "type": "WeeklyEvent",
    args: {
      starts_on: {"type": graphql.GraphQLString},
      ends_on: {"type": graphql.GraphQLString},
      start_time: {"type": graphql.GraphQLString},
      end_time: {"type": graphql.GraphQLString},
      guests: {"type": new graphql.GraphQLList(graphql.GraphQLString)}
    },
    resolve: (_, {starts_on, ends_on, start_time, end_time, guests}) => {
      return undefined;
    }
  })
  .add_type({
    name: "Description",
    fields: {
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Guest",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString}
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

mean.start();
