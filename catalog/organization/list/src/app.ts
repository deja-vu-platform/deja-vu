const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  list: {
    create: Helpers.resolve_create(mean.db, "list"),
    update: Helpers.resolve_update(mean.db, "list")
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
    name: "List",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
      items: {"type": "[Item]"},
      addItem: {
        "type": "Item",
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}, 
        },
        resolve: (list, {name}) => {
          const item = {
            atom_id: uuid.v4(),
            name: name
          };
          return Promise
            .all([
              mean.db.collection("items").insertOne(item),
              mean.db.collection("lists")
                .updateOne(
                  {atom_id: list.atom_id},
                  {$addToSet: {items: {atom_id: item.atom_id}}}),
              bus.update_atom(
                "List", list.atom_id,
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
    }
  })
 .add_mutation({
    name: "newList",
    "type": "List",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {name}) => {
      const list = {
        atom_id: uuid.v4(),
        name: name
      };
      return Promise
        .all([
          mean.db.collection("lists").insertOne(list),
          bus.create_atom("List", list.atom_id, list)
          ])
        .then(_ => list)
      } 
  })
  .schema();


Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("lists").insertOne(
      {name: "Errands", atom_id: "1",
      items: [{atom_id: "2"}, {atom_id: "3"}]},
      (err, res) => { if (err) throw err; });

    mean.db.collection("items").insertMany([
      {name: "Walk the dog", atom_id: "2"},
      {name: "Buy groceries", atom_id: "3"}], 
      (err, res) => { if (err) throw err; });
  }

  mean.start();
});