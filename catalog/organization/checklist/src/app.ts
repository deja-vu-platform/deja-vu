const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  checklist: {
    create: Helpers.resolve_create(mean.db, "checklist"),
    update: Helpers.resolve_update(mean.db, "checklist")
  },
  item: {
    create: Helpers.resolve_create(mean.db, "item"),
    update: Helpers.resolve_update(mean.db, "item")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


/////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Checkist",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
      items: {"type": "[Item]"},
      addItem: {
        "type": "Item",
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}, 
        },
        resolve: (checklist, {name}) => {
          const item = {
            atom_id: uuid.v4(),
            name: name
          };
          return Promise
            .all([
              mean.db.collection("items").insertOne(item),
              mean.db.collection("checklists")
                .updateOne(
                  {atom_id: checklist.atom_id},
                  {$addToSet: {items: {atom_id: item.atom_id}}}),
              bus.update_atom(
                "Checklist", checklist.atom_id,
                {$addToSet: {items: {atom_id: item.atom_id}}}),
              bus.create_atom("Item", item.atom_id, item)
              ])
            .then(_ => item)
       
        }
      }
    }
  })
  .add_type({
    name: "Item",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
      checked: {"type": graphql.GraphQLBoolean}
    }
  })
 .add_mutation({
    name: "newList",
    "type": "Checklist",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {name}) => {
      const checklist = {
        atom_id: uuid.v4(),
        name: name
      };
      return Promise
        .all([
          mean.db.collection("checklists").insertOne(checklist),
          bus.create_atom("Checklist", checklist.atom_id, checklist)
          ])
        .then(_ => checklist)
      }
  })
  .add_mutation({
    name: "setItemChecked", // Set the state of item.checked to the given value for some item
    type: graphql.GraphQLBoolean,
    args: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      checked: {"type": new graphql.GraphQLNonNull(graphql.GraphQLBoolean)}
    },
    resolve: (_, {atom_id, checked}) => {
      const updateOp = {
        $set: {
          checked: checked
        }
      };
      return mean.db.collection("items")
        .updateOne({
          atom_id: atom_id
        }, updateOp)
        .then(_ => bus.update_atom("Item", atom_id, updateOp))
        .then(_ => true);
    }
  })
  .schema();


Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("checklists").insertOne(
      {name: "Errands", atom_id: "1",
      items: [{atom_id: "2"}, {atom_id: "3"}]},
      (err, res) => { if (err) throw err; });

    mean.db.collection("items").insertMany([
      {name: "Walk the dog", checked: false, atom_id: "2"},
      {name: "Buy groceries", checked: true, atom_id: "3"}],
      (err, res) => { if (err) throw err; });
  }

  mean.start();
});