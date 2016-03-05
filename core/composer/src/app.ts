/// <reference path="../typings/tsd.d.ts" />
// import {Promise} from "es6-promise";
const graphql = require("graphql");

// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");

let mean;


const element_type = new graphql.GraphQLObjectType({
  name: "Element",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    "location": {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const type_type = new graphql.GraphQLObjectType({
  name: "Type",
  fields: () => ({
    element: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const field_type = new graphql.GraphQLObjectType({
  name: "Field",
  fields: () => ({
    "type": {"type": new graphql.GraphQLNonNull(type_type)},
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const type_bond_type = new graphql.GraphQLObjectType({
  name: "TypeBond",
  fields: () => ({
    types: {"type": new graphql.GraphQLList(type_type)}
  })
});

const field_bond_type = new graphql.GraphQLObjectType({
  name: "FieldBond",
  fields: () => ({
    fields: {"type": new graphql.GraphQLList(field_type)}
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      element: {
        "type": element_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, {name}) => {
          return mean.db.collection("elements").findOne({name: name});
        }
      }
    }
  }),
  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      // mutations used to build a compound
      newElement: {
        "type": element_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          loc: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          }
        },
        resolve: (root, elem) => {
          console.log("new element!");
          return mean.db.collection("elements").insertOne(elem);
        }
      },
      newTypeBond: {
        "type": type_bond_type,
        args: {
          types: {"type": new graphql.GraphQLList(type_type)},
        },
        resolve: (root, type_bond) => {
          console.log("new type bond!");
          return mean.db.collection("tbonds").insertOne(type_bond);
        }
      },

      newFieldBond: {
        "type": field_bond_type,
        args: {
          fields: {"type": new graphql.GraphQLList(field_type)},
        },
        resolve: (root, field_bond) => {
          console.log("new field bond!");
          return mean.db.collection("fbonds").insertOne(field_bond);
        }
      },

      // mutations used by elements to report mutations to their state
      newAtom: {
        "type": element_type,
        args: {
          "type": {"type": new graphql.GraphQLNonNull(type_type)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLObject)}
        },
        resolve: (root, {t, atom}) => {
          console.log("got");
          console.log(JSON.stringify(t));
          console.log(JSON.stringify(atom));
        }
      }
    }
  })
});

mean = new mean_mod.Mean("composer", schema, (db, debug) => {
  db.createCollection("elements", (err, _) => {if (err) throw err;});
  db.createCollection("tbonds", (err, _) => {if (err) throw err;});
  db.createCollection("fbonds", (err, _) => {if (err) throw err;});
});
