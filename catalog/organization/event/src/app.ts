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
  guest: {
    create: Helpers.resolve_create(mean.db, "guest"),
    update: Helpers.resolve_update(mean.db, "guest")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const get_hh_mm = hh_mm_time => {
  const hh_mm = hh_mm_time.slice(0, -2).split(":");
  if (hh_mm_time.slice(-2) === "PM") {
    hh_mm[0] = Number(hh_mm[0]) + 12;
  }
  return hh_mm;
}

const schema = grafo
  .add_type({
    name: "Event",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      // TODO: grafo should allow weak types
      start_date: {"type": graphql.GraphQLString},
      end_date: {"type": graphql.GraphQLString},
      updateEvent: {
        type: "Event",
        args: {
          starts_on: {"type": graphql.GraphQLString},
          ends_on: {"type": graphql.GraphQLString},
          start_time: {"type": graphql.GraphQLString},
          end_time: {"type": graphql.GraphQLString}
        },
        resolve: (event, {starts_on, ends_on, start_time, end_time}) => {
          const starts_on_date = new Date(starts_on);
          const ends_on_date = new Date(ends_on);

          const start_hh_mm = get_hh_mm(start_time);
          const end_hh_mm = get_hh_mm(end_time);

          starts_on_date.setHours(start_hh_mm[0], start_hh_mm[1]);
          ends_on_date.setHours(end_hh_mm[0], end_hh_mm[1]);

          const update_obj = {
            $set: {
              start_date: starts_on_date.toString(),
              end_date: ends_on_date.toString()
            }
          };

          return mean.db.collection("events")
            .update({atom_id: event.atom_id}, update_obj)
            .then(_ => bus.update_atom("Event", event.atom_id, update_obj));
        }
      }
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
    name: "newWeeklyPublicEvent",
    "type": "WeeklyEvent",
    args: {
      starts_on: {"type": graphql.GraphQLString},
      ends_on: {"type": graphql.GraphQLString},
      start_time: {"type": graphql.GraphQLString},
      end_time: {"type": graphql.GraphQLString}
    },
    resolve: (_, {starts_on, ends_on, start_time, end_time}) => {
      const starts_on_date = new Date(starts_on);
      const ends_on_date = new Date(ends_on);

      const inserts = [];
      const event_ids = [];
      for (
        let event_date = starts_on_date; event_date <= ends_on_date;
        event_date.setDate(event_date.getDate() + 7)) {

        const start_date = new Date(event_date.getTime());
        const start_hh_mm = get_hh_mm(start_time)
        start_date.setHours(start_hh_mm[0], start_hh_mm[1])

        const end_date = new Date(event_date.getTime());
        const end_hh_mm = get_hh_mm(end_time)
        end_date.setHours(end_hh_mm[0], end_hh_mm[1])

        const eid = uuid.v4();
        event_ids.push(eid);
        const e = {
          atom_id: eid,
          start_date: start_date.toString(),
          end_date: end_date.toString()
        };
        inserts.push(
            mean.db.collection("events")
              .insertOne(e)
              .then(_ => bus.create_atom("Event", eid, e)));
      }
      const weid = uuid.v4();
      return Promise.all(inserts)
        .then(_ => mean.db.collection("guests")
          .find({}).project({atom_id: 1}).toArray()
          .then(guests => ({
            atom_id: weid,
            events: _u.map(event_ids, eid => ({atom_id: eid})),
            starts_on: starts_on,
            ends_on: ends_on,
            guests: guests
          })))
        .then(weekly_event => mean.db.collection("weeklyevents")
          .insertOne(weekly_event)
          .then(_ => bus.create_atom("WeeklyEvent", weid, weekly_event))
          .then(_ => weekly_event));
    }
  })
  .add_mutation({
    name: "newPublicEvent",
    "type": "Event",
    args: {
      starts_on: {"type": graphql.GraphQLString},
      ends_on: {"type": graphql.GraphQLString},
      start_time: {"type": graphql.GraphQLString},
      end_time: {"type": graphql.GraphQLString}
    },
    resolve: (_, {starts_on, ends_on, start_time, end_time}) => {
      const starts_on_date = new Date(starts_on);
      const ends_on_date = new Date(ends_on);

      const inserts = [];
      const event_ids = [];

      const start_hh_mm = get_hh_mm(start_time)
      starts_on_date.setHours(start_hh_mm[0], start_hh_mm[1])

      const end_hh_mm = get_hh_mm(end_time)
      ends_on_date.setHours(end_hh_mm[0], end_hh_mm[1])

      const eid = uuid.v4();
      event_ids.push(eid);
      const e = {
        atom_id: eid,
        start_date: starts_on_date.toString(),
        end_date: ends_on_date.toString()
      };
      return mean.db.collection("events")
        .insertOne(e)
        .then(_ => bus.create_atom("Event", eid, e))
        .then(_ => e);
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
