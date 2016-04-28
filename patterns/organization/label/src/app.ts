/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");

const mean = new mean_mod.Mean(
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


const label_type = new graphql.GraphQLObjectType({
  name: "Label",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const label_input_type = new graphql.GraphQLInputObjectType({
  name: "LabelInput",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const item_type = new graphql.GraphQLObjectType({
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
          .then(_ => mean.composer.update_atom(item_type, item.atom_id, up_op));
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
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
      _dv_new_item: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: mean.resolve_dv_new("item")
      },
      _dv_update_item: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_up("item")
      },
      _dv_new_label: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: mean.resolve_dv_new("label")
      },
      _dv_update_label: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: mean.resolve_dv_up("label")
      }
    })
  })
});


mean.serve_schema(schema);
