/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");

import {Mean} from "mean";

let mean;


const element_type = new graphql.GraphQLObjectType({
  name: "Element",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    "location": {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

/*
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
*/

const type_input_type = new graphql.GraphQLInputObjectType({
  name: "TypeInput",
  fields: () => ({
    element: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const field_input_type = new graphql.GraphQLInputObjectType({
  name: "FieldInput",
  fields: () => ({
    "type": {"type": new graphql.GraphQLNonNull(type_input_type)},
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const type_bond_input_type = new graphql.GraphQLInputObjectType({
  name: "TypeBondInput",
  fields: () => ({
    types: {"type": new graphql.GraphQLList(type_input_type)}
  })
});

const field_bond_input_type = new graphql.GraphQLInputObjectType({
  name: "FieldBondInput",
  fields: () => ({
    fields: {"type": new graphql.GraphQLList(field_input_type)}
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
        "type": graphql.GraphQLBoolean,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          loc: {
            "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
          }
        },
        resolve: (root, elem) => {
          console.log("new element!");
          return mean.db.collection("elements").insertOne(elem)
            .then(res => res.insertedCount === 1);
        }
      },
      newTypeBond: {
        "type": graphql.GraphQLBoolean,
        args: {
          type_bond: {"type": new graphql.GraphQLNonNull(type_bond_input_type)},
        },
        resolve: (root, type_bond) => {
          console.log("new type bond!");
          return mean.db.collection("tbonds").insertOne(type_bond)
            .then(res => res.insertedCount === 1);
        }
      },

      newFieldBond: {
        "type": graphql.GraphQLBoolean,
        args: {
          field_bond: {
            "type": new graphql.GraphQLNonNull(field_bond_input_type)
          },
        },
        resolve: (root, field_bond) => {
          console.log("new field bond!");
          return mean.db.collection("fbonds").insertOne(field_bond)
            .then(res => res.insertedCount === 1);
        }
      },

      // atom is an arbitraty json
      // mutations used by elements to report mutations to their state
      newAtom: {
        "type": graphql.GraphQLBoolean,
        args: {
          "type": {"type": new graphql.GraphQLNonNull(type_input_type)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, {t, atom}) => {
          console.log("got");
          console.log(JSON.stringify(t));
          console.log(atom);
          return true;
        }
      }
    }
  })
});

mean = new Mean("composer", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("elements", (err, _) => {if (err) throw err;});
    db.createCollection("tbonds", (err, _) => {if (err) throw err;});
    db.createCollection("fbonds", (err, _) => {if (err) throw err;});
  }
});
