/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";

import * as _u from "underscore";


const mean = new Mean(
  "label",
  (db, debug) => {
    db.createCollection("items", (err, items) => {
      if (err) throw err;
      console.log("Resetting items collection");
      items.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          items.insertMany([
            {
              atom_id: "item", name: "item",
              labels: [{atom_id: "label1"}, {atom_id: "label2"}]
            },
            {
              atom_id: "another-item", name: "another-item",
              labels: [{atom_id: "label1"}]
            }
          ], (err, res) => { if (err) throw err; });
        }
        });
    });

    db.createCollection("labels", (err, items) => {
      if (err) throw err;
      console.log("Resetting labels collection");
      items.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          items.insertMany([
            {atom_id: "label1", name: "label1"},
            {atom_id: "label2", name: "label2"}
          ], (err, res) => { if (err) throw err; });
        }
        });
    });
  }
);


let bus;

//////////////////////////////////////////////////


let item_type;

const label_type = new graphql.GraphQLObjectType({
  name: "Label",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    // tmp hack until the composer can do undirected field bonds
    items: {"type": new graphql.GraphQLList(item_type)}
  })
});

const label_input_type = new graphql.GraphQLInputObjectType({
  name: "LabelInput",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

item_type = new graphql.GraphQLObjectType({
  name: "Item",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    labels: {
      "type": new graphql.GraphQLList(label_type),
      resolve: item => mean.db.collection("labels")
          .find({atom_id: {$in: item.labels.map(l => l.atom_id)}})
    },
    attach_labels: {
      "type": graphql.GraphQLBoolean,
      args: {
        labels: {"type": new graphql.GraphQLList(label_input_type)}
      },
      resolve: (item, {labels}) => {
        const label_objs = mean.db.collection("labels")
            .find({name: {$in: labels}}, {atom_id: 1}).toArray();
        const up_op = {$addToSet: {labels: {$each: label_objs}}};
        return mean.db.collection("items")
          .updateOne({name: item.name}, up_op)
          .then(_ => Promise.all([
              bus.update_atom(item_type, item.atom_id, up_op),
              Promise.all(
                label_objs.map(l => bus
                  .update_atom(
                    label_type, l.atom_id, {$addToSet: {items: l.atom_id}})))
              ]));
      }
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      item: {
        "type": item_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {name}) => {
          console.log(`getting ${name}`);
          return mean.db.collection("items").findOne({name: name});
        }
      },
      items: {
        "type": new graphql.GraphQLList(item_type),
        args: {
          query: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {query}) => {
          console.log(`getting items with query ` + query);
          return mean.db.collection("items").find().toArray();
        }
      },
    })
  })
});


Helpers.serve_schema(mean.ws, schema);


const handlers = {
  item: {
    create: (_, args) => Helpers
      .resolve_create(mean.db, "item")(undefined, args)
      .then(_ => {
        const atom_obj = JSON.parse(args.atom);
        atom_obj.atom_id = args.atom_id;
        if (!_u.isEmpty(atom_obj.labels)) {
          return mean.db.collection("labels")
              .updateMany(
                {atom_id: {$in: atom_obj.labels}},
                {$addToSet: {items: atom_obj.atom_id}})
              .then(_ => Promise.all(
                  atom_obj.labels.map(l => bus
                    .update_atom(
                      label_type,
                      l.atom_id,
                      {$addToSet: {items: atom_obj.atom_id}}
                      )
                    )
                  )
                );
        }
        return true;
      }),
    update: (_, args) => Helpers
      .resolve_update(mean.db, "item")(undefined, args)
      .then(_ => {
        const labels = [];
        for (const up of _u.keys(args.update)) {
          for (const field of _u.keys(up)) {
            if (field.indexOf("labels") === 0) {
              labels.push(up[field]);
            }
          }
        }

        if (!_u.isEmpty(labels)) {
          return mean.db.collection("labels")
              .updateMany(
                {atom_id: {$in: labels}},
                {$addToSet: {items: args.atom_id}})
              .then(_ => Promise.all(
                  labels.map(l => bus
                    .update_atom(
                      label_type,
                      l.atom_id,
                      {$addToSet: {items: args.atom_id}}
                      )
                    )
                  )
                );
        }
        return true;
      })
  },
  label: {
    create: (_, args) => Helpers
      .resolve_create(mean.db, "label")(undefined, args)
      .then(_ => {
        const atom_obj = JSON.parse(args.atom);
        atom_obj.atom_id = args.atom_id;
        if (!_u.isEmpty(atom_obj.items)) {
          return mean.db.collection("items")
              .updateMany(
                {atom_id: {$in: atom_obj.items}},
                {$addToSet: {labels: atom_obj.atom_id}})
              .then(_ => Promise.all(
                  atom_obj.items.map(a => bus
                    .update_atom(
                      item_type,
                      a.atom_id,
                      {$addToSet: {labels: atom_obj.atom_id}}
                      )
                    )
                  )
                );
        }
      }),
     update: (_, args) => Helpers
       .resolve_update(mean.db, "label")(undefined, args)
       .then(_ => {
         const items = [];
         for (const up of _u.keys(args.update)) {
           for (const field of _u.keys(up)) {
             if (field.indexOf("items") === 0) {
               items.push(up[field]);
             }
           }
         }

         if (!_u.isEmpty(items)) {
           return mean.db.collection("items")
               .updateMany(
                 {atom_id: {$in: items}},
                 {$addToSet: {labels: args.atom_id}})
               .then(_ => Promise.all(
                   items.map(i => bus
                     .update_atom(
                       item_type,
                       i.atom_id,
                       {$addToSet: {labels: args.atom_id}}
                       )
                     )
                   )
                 );
         }
         return true;
       })
  }
};

bus = new ServerBus(
    "label", mean.loc, mean.ws, mean.bushost, mean.busport, handlers);
