/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");

let mean;


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
      resolve: item => item.labels
    },
    attach_labels: {
      "type": graphql.GraphQLBoolean,
      args: {
        labels: {"type": new graphql.GraphQLList(label_input_type)}
      },
      resolve: (item, {labels}) => {
        const items = mean.db.collection("items");
        return items.updateOne(
        {name: item.name}, {$addToSet: {labels: labels}}).then(
            _ => report_update(item.name));
      }
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
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
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      _dv_new_item: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, args) => {
          const item = JSON.parse(args.atom);
          console.log("got new item from bus " + JSON.stringify(item));
          item["atom_id"] = args.atom_id;
          return mean.db.collection("items").insertOne(item)
            .then(res => res.insertedCount === 1);
        }
      },
      _dv_update_item: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const item = JSON.parse(args.atom);
          console.log("got up item from bus " + JSON.stringify(item));
          return true;
        }
      },
      _dv_new_label: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, args) => {
          const label = JSON.parse(args.atom);
          console.log("got new label from bus " + JSON.stringify(label));
          label["atom_id"] = args.atom_id;
          return mean.db.collection("labels").insertOne(label)
            .then(res => res.insertedCount === 1);
        }
      },
      _dv_update_label: {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => {
          const label = JSON.parse(args.atom);
          console.log("got up label from bus " + JSON.stringify(label));
          return true;
        }
      }
    }
  })
});


function report_update(name) {
  console.log("reporting update of " + name);
  const items = mean.db.collection("items");
  return items.findOne({name: name}).then(item => {
    console.log(JSON.stringify(item));
    return mean.composer.update_atom("Item", item.atom_id, item);
  });
}


mean = new mean_mod.Mean("label", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("items", (err, items) => {
      if (err) throw err;
      console.log("Resetting items collection");
      items.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        if (debug) {
          items.insertMany([
            {name: "item", labels: [{name: "label1"}, {name: "label2"}]},
            {name: "another-item", labels: [{name: "label1"}]}
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
            {name: "label1"},
            {name: "label2"}
          ], (err, res) => { if (err) throw err; });
        }
        });
    });

  }
});
