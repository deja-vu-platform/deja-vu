import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const uuid = require("uuid");


const mean = new Mean();

let bus;

//////////////////////////////////////////////////


const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Label",
    fields: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      // tmp hack until the composer can do undirected field bonds
      items: {"type": "[Item]"}
    }
  })
  .add_type({
    name: "Item",
    fields: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      labels: {
        "type": "[Label]",
        resolve: item => {
          if (_u.isEmpty(item.labels)) return [];
          return mean.db.collection("labels")
            .find({atom_id: {$in: item.labels.map(l => l.atom_id)}})
            .toArray();
        }
      },
      attach_labels: {
        "type": graphql.GraphQLBoolean,
        args: {
          labels: {"type": new graphql.GraphQLList(graphql.GraphQLString)}
        },
        resolve: (item, {labels}) => mean.db.collection("labels")
              .find({name: {$in: labels}})
              .project({atom_id: 1, _id: 0})
              .toArray()
              .then(label_objs => {
                const up_op = {$addToSet: {labels: {$each: label_objs}}};
                return mean.db.collection("items")
                  .updateOne({atom_id: item.atom_id}, up_op)
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
    }
  })
  .add_query({
    name: "label",
    "type": "Label",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {name}) => {
      console.log(`getting ${name}`);
      return mean.db.collection("labels").findOne({name: name});
    }
  })
  .add_query({
    name: "item",
    "type": "Item",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {name}) => {
      console.log(`getting ${name}`);
      return mean.db.collection("items").findOne({name: name});
    }
  })
  .add_query({
    name: "items",
    "type": "[Item]",
    args: {
      query: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {query}) => {
      console.log(`getting items with query ` + query);
      return mean.db.collection("items").find().toArray();
    }
  })
  .add_mutation({
    name: "createOrGetLabel",
    "type": "Label",
     args: {
       name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
     },
     resolve: (_, {name}) => mean.db.collection("labels")
       .find({name: name})
       .toArray()
       .then(res => {
         if (res.length === 0) {
           const l = {atom_id: uuid.v4(), name: name, items: []};
           return mean.db.collection("labels")
             .insertOne(l)
             .then(_ => bus.create_atom("Label", l.atom_id, l))
             .then(_ => l);
         }
         return res[0];
       })
  })
  .schema();


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
                      "Label",
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
                      "Label",
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
                      "Item",
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
                       "Item",
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

grafo.init().then(_ => mean.start());
