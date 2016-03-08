/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
import * as http from "http";

import {Mean} from "mean";

let mean;


/*
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
*/

const type_input_type = new graphql.GraphQLInputObjectType({
  name: "TypeInput",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    element: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    loc: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
  })
});

const field_input_type = new graphql.GraphQLInputObjectType({
  name: "FieldInput",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    "type": {"type": new graphql.GraphQLNonNull(type_input_type)}
  })
});
/*
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
*/

const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      t: {
        "type": graphql.GraphQLBoolean,
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, {name}) => {
          // todo?
          console.log(name);
        }
      }
    }
  }),
  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      // mutations used to build a compound
      newTypeBond: {
        "type": graphql.GraphQLBoolean,
        args: {
          types: {"type": new graphql.GraphQLList(type_input_type)},
        },
        resolve: (root, {types}) => {
          console.log("new type bond! " + JSON.stringify(types));
          return mean.db.collection("tbonds").insertOne({types: types})
            .then(res => res.insertedCount === 1);
        }
      },

      newFieldBond: {
        "type": graphql.GraphQLBoolean,
        args: {
          fields: {"type": new graphql.GraphQLList(field_input_type)}
        },
        resolve: (root, {fields}) => {
          console.log("new field bond! " + JSON.stringify(fields));
          return mean.db.collection("fbonds").insertOne({fields: fields})
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
        resolve: (root, args) => {
          const t = args.type;
          const atom = args.atom;
          console.log("new atom! " + JSON.stringify(t) + atom);
          // hack
          // should make this efficient..also compute the intersection of fields
          // taking into account fbonds
          mean.db.collection("tbonds").find().toArray()
            .then(a => {
              console.log("debug col");
              for (let b of a) {
                console.log(JSON.stringify(b));
              }
              console.log("end debug col");
            });
          mean.db.collection("tbonds").find({types: {$in: [t]}})
            .toArray()
            .then(type_bonds => {
              console.log("got " + type_bonds.length + " tbonds");
              for (let type_bond of type_bonds) {
                console.log("processing " + JSON.stringify(type_bond));
                /*
                mean.db.collection("fbonds").find({fields: {"type": bt}})
                  .toArray()
                  .then(bonded_fields => {
                    for (let fbond of bonded_fields) {

                    }
                  });
                  */
                 for (let bonded_type of type_bond.types) {
                   if (bonded_type.name === t.name &&
                       bonded_type.element === t.element &&
                       bonded_type.loc === t.loc) {
                     continue;
                   }
                   send_update(bonded_type, t, atom);
                 }
              }
            });
            return true;
        }
      }
    }
  })
});

function send_update(dst, src, atom) {
  console.log("Sending update to element " + dst.element);
  console.log("have <" + atom + ">");
  transform_atom(dst, atom, transformed_atom => {
    const atom_str = transformed_atom.replace(/"/g, "\\\"");
    console.log("now have <" + atom_str + ">");
    post(dst.loc, `{
        _dv_new_${dst.name.toLowerCase()}(atom: "${atom_str}")
    }`);

  });
}

function transform_atom({name, element, loc}, atom, callback) {
  console.log(`Getting schema info for ${element}/${name}`);
  const query = `{
    __type(name: "${name}") {
      name,
      fields {
        name,
        type {
          name,
          kind,
          ofType {
            name,
            kind
          }
        }
      }
    }
  }`;
  get(loc, query, res => {
    console.log("got back " + JSON.stringify(res));
    const parsed_atom = JSON.parse(atom);
    // todo
    let transformed_atom = JSON.stringify(parsed_atom);
    callback(transformed_atom);
  });
}


function post(loc, query) {
  const match = loc.match(/http:\/\/(.*):(.*)/);
  const hostname = match[1];
  const port = match[2];

  const query_str = query.replace(/ /g, "");
  const post_data = JSON.stringify({query: "mutation " + query_str});

  const options = {
    hostname: hostname,
    port: port,
    method: "post",
    path: "/graphql",
    headers: {
      "Content-type": "application/json",
      "Content-length": post_data.length
    }
  };

  console.log(
    "using options " + JSON.stringify(options) +
    " for query <" + query_str + ">");
  const req = http.request(options);
  req.on("response", res => {
    let body = "";
    res.on("data", d => { body += d; });
    res.on("end", () => {
      console.log(`got ${body} back from ${hostname}:${port}`);
    });
  });
  req.on("error", err => console.log(err));

  req.write(post_data);
  req.end();
}

function get(loc, query, callback) {
  const match = loc.match(/http:\/\/(.*):(.*)/);
  const hostname = match[1];
  const port = match[2];

  const query_str = encodeURIComponent(
    query.replace(/ /g, "").replace(/\n/g, ""));

  const options = {
    hostname: hostname,
    port: port,
    method: "get",
    path: `/graphql?query=query+${query_str}`
  };

  console.log(
    "using options " + JSON.stringify(options) +
    " for query <" + query_str + ">");
  const req = http.request(options);
  req.on("response", res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", d => { body += d; });
    res.on("end", () => {
      console.log(`got ${body} back from ${hostname}:${port}`);
      callback(body);
    });
  });
  req.on("error", err => console.log(err));
  req.end();
}

mean = new Mean("composer", {
  graphql_schema: schema,
  init_db: (db, debug) => {
    db.createCollection("tbonds", (err, tbonds) => {
      if (err) throw err;
      if (debug) {
        console.log("Resetting tbonds collection");
        tbonds.remove((err, remove_count) => {
          if (err) throw err;
          console.log(`Removed ${remove_count} elems`);
        });
      }
    });
    db.createCollection("fbonds", (err, fbonds) => {
      if (err) throw err;
      if (debug) {
        console.log("Resetting fbonds collection");
        fbonds.remove((err, remove_count) => {
          if (err) throw err;
          console.log(`Removed ${remove_count} elems`);
        });
      }
    });
  }
});
