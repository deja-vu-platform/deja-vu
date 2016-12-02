/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const uuid = require("uuid");

const mean = new Mean();


const handlers = {
  "event": {
    create: Helpers.resolve_create(mean.db, "event"),
    update: Helpers.resolve_update(mean.db, "event")
  },
  "weeklyevent": {
    create: Helpers.resolve_create(mean.db, "weeklyevent"),
    update: Helpers.resolve_update(mean.db, "weeklyevent")
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
      start_date: {"type": graphql.GraphQLString},
      end_date: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "WeeklyEvent",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      events: {"type": "[Event]"},
      starts_on: {"type": graphql.GraphQLString},
      ends_on: {"type": graphql.GraphQLString}
    }
  })
  .add_mutation({
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
      const starts_on_date = new Date(starts_on);
      const ends_on_date = new Date(ends_on);

      const inserts = [];
      const event_ids = [];
      for (
        let event_date = starts_on_date; event_date <= ends_on_date;
        event_date.setDate(event_date.getDate() + 7)) {
        const start_date = new Date(event_date.toString());
        start_date.setTime(start_time);

        const end_date = new Date(event_date.toString());
        end_date.setTime(end_time);

        console.log(event_date.toString());
        const eid = uuid.v4();
        event_ids.push(eid);
        inserts.push(
            mean.db.collection("events")
              .insertOne({
                atom_id: eid,
                start_date: start_date.toString(),
                end_date: end_date.toString()
              }));
      }
      const weekly_event = {
        atom_id: uuid.v4,
        events: _u.map(event_ids, eid => ({atom_id: eid})),
        starts_on: starts_on,
        ends_on: ends_on
      };
      return Promise.all(inserts)
        .then(_ => mean.db.collection("weeklyevents").insertOne(weekly_event))
        .then(_ => weekly_event);
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

grafo.init().then(_ => mean.start());
