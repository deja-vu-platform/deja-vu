/// <reference path="../typings/tsd.d.ts" />
import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Label} from "./shared/label";

import * as _u from "underscore";


const mean = new Mean(
  (db, debug) => {
    db.createCollection("items", (err, items) => {
      if (err) throw err;
      console.log("Resetting items collection");
      items.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} items`);
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
          ], (err, res) => {
            if (err) throw err;
            console.log(`Inserted ${res.insertedCount} items for debug`);
          });
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
    atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
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
          .toArray()
    },
    attach_labels: {
      "type": graphql.GraphQLBoolean,
      args: {
        labels: {"type": new graphql.GraphQLList(label_input_type)}
      },
      resolve: (item, {labels}) => mean.db.collection("labels")
            .find({name: {$in: _u.map(labels, (l: Label) => l.name)}})
            .project({atom_id: 1, _id: 0})
            .toArray()
            .then(label_objs => {
              const up_op = {$addToSet: {labels: {$each: label_objs}}};
              return mean.db.collection("items")
                .updateOne({name: item.name}, up_op)
                .then(_ => Promise.all([
                    bus.update_atom("Item", item.atom_id, up_op),
                    Promise.all(
                      label_objs.map(l => bus
                        .update_atom(
                          "Label", l.atom_id,
                          {$addToSet: {items: {atom_id: item.atom_id}}})))
                    ]));
                  })
            .then(_ => true)
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: () => ({
      label: {
        "type": label_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {name}) => {
          console.log(`getting ${name}`);
          return mean.db.collection("labels").findOne({name: name});
        }
      },
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
      item_by_id: {
        "type": item_type,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {atom_id}) => {
          console.log(`getting ${atom_id}`);
          return mean.db.collection("items").findOne({atom_id: atom_id});
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
  }),
  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      createOrGetLabel: {
        "type": label_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (_, {name}) => mean.db.collection("labels").findOneAndReplace(
          {name: name},
          {atom_id: name, name: name, items: []},
          {
            upsert: true,
            returnOriginal: false
          })
          .then(up => {
            const l = up.value;
            if (!up.lastErrorObject.updatedExisting) {
              return bus.create_atom("Label", l.atom_id, l).then(_ => l);
            }
            return l;
          })
      } 
    })
  })
});


Helpers.serve_schema(mean.ws, schema);


const handlers = {
  item: {
    create: args => Helpers
      .resolve_create(mean.db, "item")(args)
      .then(_ => {
        const atom_obj = JSON.parse(args.create);
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
    update: args => Helpers
      .resolve_update(mean.db, "item")(args)
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
    create: args => Helpers
      .resolve_create(mean.db, "label")(args)
      .then(_ => {
        const atom_obj = JSON.parse(args.create);
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
     update: args => Helpers
       .resolve_update(mean.db, "label")(args)
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
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);

mean.start();
