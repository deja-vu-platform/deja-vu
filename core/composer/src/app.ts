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
    element: {"type": new graphql.GraphQLNonNull(element_type)},
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

const compound_type = new graphql.GraphQLObjectType({
  name: "Compound",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    elements: {
      "type": new graphql.GraphQLList(element_type),
      resolve: compound => compound.elements
    },
    type_bonds: {
      "type": new graphql.GraphQLList(type_bond_type),
      resolve: compound => compound.type_bonds
    },
    field_bonds: {
      "type": new graphql.GraphQLList(field_bond_type),
      resolve: compound => compound.field_bonds
    },
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      compound: {
        "type": compound_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, {name}) => {
          return mean.db.collection("compounds").findOne({name: name});
        }
      }
    }
  }),
  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      newCompound: {
        "type": compound_type,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          elements: {"type": new graphql.GraphQLList(element_type)},
          type_bonds: {"type": new graphql.GraphQLList(type_bond_type)},
          field_bonds: {"type": new graphql.GraphQLList(field_bond_type)}
        },
        resolve: (root, compound) => {
          return mean.db.collection("compounds").insertOne(compound);
        }
      },
      newAtom: {
        "type": compound_type,
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
  db.createCollection("compounds", (err, _) => {
    if (err) throw err;
  });
});
