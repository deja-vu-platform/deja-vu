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
          subtype: {"type": type_input_type}
        },
        resolve: (root, {types, subtype}) => {
          console.log("new type bond! " + JSON.stringify(types));
          return mean.db.collection("tbonds")
            .insertOne({types: types, subtype: subtype})
            .then(res => res.insertedCount === 1);
        }
      },

      newFieldBond: {
        "type": graphql.GraphQLBoolean,
        args: {
          fields: {"type": new graphql.GraphQLList(field_input_type)},
          subfield: {"type": field_input_type}
        },
        resolve: (root, {fields, subfield}) => {
          console.log("new field bond! " + JSON.stringify(fields));
          return mean.db.collection("fbonds")
            .insertOne({fields: fields, subfield: subfield})
            .then(res => res.insertedCount === 1);
        }
      },

      // atom is an arbitraty json
      // mutations used by elements to report mutations to their state
      newAtom: {
        "type": graphql.GraphQLBoolean,
        args: {
          "type": {"type": new graphql.GraphQLNonNull(type_input_type)},
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => process("new", args)
      },
      updateAtom: {
        "type": graphql.GraphQLBoolean,
        args: {
          "type": {"type": new graphql.GraphQLNonNull(type_input_type)},
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => process("update", args)
      }
    }
  })
});

function process(op: string, args: any) {
  const t: Type = new Type(
    args.type.name, args.type.element, args.type.loc);
  const atom = args.atom;
  const atom_id = args.atom_id;
  console.log(`${op} atom! ${JSON.stringify(t)} ${atom}`);


  // Downwards propagation
  mean.db.collection("tbonds").find({types: {$in: [t]}})
    .toArray()
    .then(type_bonds => {
      console.log("got " + type_bonds.length + " tbonds for downwards prop");
      for (let type_bond of type_bonds) {
        console.log("processing " + JSON.stringify(type_bond));

         for (let bonded_type of type_bond.types) {
           bonded_type = new Type(
             bonded_type.name, bonded_type.element, bonded_type.loc);
           if (bonded_type.equals(t)) {
             continue;
           }
           send_update(true, op, bonded_type, t, atom_id, atom);
         }
      }
    });

  // Upwards propagation
  mean.db.collection("tbonds").find({subtype: t})
    .toArray()
    .then(type_bonds => {
      console.log("got " + type_bonds.length + " tbonds for upwards prop");
      for (let type_bond of type_bonds) {
        console.log("processing " + JSON.stringify(type_bond));

         for (let bonded_type of type_bond.types) {
           bonded_type = new Type(
             bonded_type.name, bonded_type.element, bonded_type.loc);
           send_update(false, op, bonded_type, t, atom_id, atom);
         }
      }
    });

  return true;
}

function send_update(
  downwards: boolean, op: string, dst: Type, src: Type, atom_id: string,
  atom: string) {
  console.log("Sending update to element " + dst.element);
  console.log("have <" + atom + ">");
  transform_atom(downwards, dst, src, atom, transformed_atom => {
    const atom_str = transformed_atom.replace(/"/g, "\\\"");
    console.log("now have <" + atom_str + ">");
    post(dst.loc, `{
        _dv_${op}_${dst.name.toLowerCase()}(
          atom_id: "${atom_id}", atom: "${atom_str}")
    }`);
  });
}

class Type {
  constructor(
      public name: string, public element: string, public loc: string) {}

  equals(other: Type) {
    return (
      this.name === other.name && this.element === other.element &&
      this.loc === other.loc);
  }
}

function transform_atom(
  downwards: boolean, dst: Type, src: Type, atom, callback) {
  console.log(`Getting schema info for ${dst.element}/${dst.name}`);
  const query = `{
    __type(name: "${dst.name}") {
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
  const get_name_map = downwards ? get_name_map_downwards:get_name_map_upwards;


  get(dst.loc, query, res => {
    const dst_type_info = JSON.parse(res).data.__type;
    get_name_map(src, dst, name_map => {
      const parsed_atom = JSON.parse(atom);
      let transformed_atom = {};
      for (let dst_f of dst_type_info.fields) {
        if (parsed_atom[dst_f.name] !== undefined) {
          transformed_atom[dst_f.name] = parsed_atom[dst_f.name];
        } else if (name_map[dst_f.name] !== undefined) {
          transformed_atom[dst_f.name] = parsed_atom[name_map[dst_f.name]];
        } else {
          // Send well-formed atoms to elements
          transformed_atom[dst_f.name] = get_null(dst_f.type);
        }
      }

      const transformed_atom_str = JSON.stringify(transformed_atom);
      console.log(
        "trasnformed atom str " + transformed_atom_str + " used name map " +
        JSON.stringify(name_map));
      callback(transformed_atom_str);
    });
  });
}

function get_name_map_downwards(src, dst, callback) {
  mean.db.collection("fbonds")
    .aggregate([  // get fbonds where both src and dst appear
      {$match: {fields: {$elemMatch: {"type": dst}}}},
      {$match: {fields: {$elemMatch: {"type": src}}}}
    ])
    .toArray()
    .then(fbonds => {
      let name_map = {};
      for (let fbond of fbonds) {
        // console.log("processing fbond " + JSON.stringify(fbond));
        // a given type can only appear once in a field bond
        let src_fbond_info, dst_fbond_info;
        for (let finfo of fbond.fields) {
          if (src.equals(finfo.type)) {
            src_fbond_info = finfo;
          } else if (dst.equals(finfo.type)) {
            dst_fbond_info = finfo;
          }
        }
        name_map[dst_fbond_info.name] = src_fbond_info.name;
      }
      callback(name_map);
    });
}

function get_name_map_upwards(src, dst, callback) {
/*
  mean.db.collection("fbonds").find({"subfield.type": src}).toArray()
    .then(a => {
      console.log("22DEEBUUUGG " + JSON.stringify(src));
      for (let b of a) {
        console.log(JSON.stringify(b));
      }
      console.log("22FBOND end debug col");
    });
  mean.db.collection("fbonds").find().toArray()
    .then(a => {
      console.log("DEEBUUUGG");
      for (let b of a) {
        console.log(JSON.stringify(b));
      }
      console.log("FBOND end debug col");
    });
*/
  mean.db.collection("fbonds")
    .aggregate([
      {$match: {fields: {$elemMatch: {"type": dst}}}},
      {$match: {"subfield.type": src}},
    ])
    .toArray()
    .then(fbonds => {
      let name_map = {};
      for (let fbond of fbonds) {
        console.log("processing fbond " + JSON.stringify(fbond));
        // a given type can only appear once in a field bond
        let dst_fbond_info;
        for (let finfo of fbond.fields) {
          if (dst.equals(finfo.type)) {
            dst_fbond_info = finfo;
          }
        }
        name_map[dst_fbond_info.name] = fbond.subfield.name;
      }
      console.log(
        "got " + fbonds.length + " back, used " + JSON.stringify(dst) +
        " and " + JSON.stringify(src) + " name map " +
        JSON.stringify(name_map));
      callback(name_map);
    });
}

function get_null(t) {
  let ret;
  if (t.kind === "LIST") {
    ret = [];
  } else if (t.ofType.name === "String") {
    ret = "";
  }
  return ret;
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
      console.log("Resetting tbonds collection");
      tbonds.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
      });
    });
    db.createCollection("fbonds", (err, fbonds) => {
      if (err) throw err;
      console.log("Resetting fbonds collection");
      fbonds.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
      });
    });
  }
});
