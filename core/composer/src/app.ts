/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
const rp = require("request-promise");

import {Mean} from "mean";


const mean = new Mean(
  "composer",
  (db, debug) => {
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
);


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
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, args) => process("update", args)
      }
    }
  })
});

mean.serve_schema(schema);


function process(op: string, args: any) {
  const t: Type = new Type(
    args.type.name, args.type.element, args.type.loc);
  console.log(`${op} atom! ${JSON.stringify(t)} ${JSON.stringify(args)}`);


  // Downwards propagation
  const downwards_p = mean.db.collection("tbonds")
    .find({types: {$in: [t]}})
    .toArray()
    .then(type_bonds => {
      console.log("got " + type_bonds.length + " tbonds for downwards prop");
      const updates_p = [];

      for (let type_bond of type_bonds) {
        console.log("processing " + JSON.stringify(type_bond));
        for (let bonded_type of type_bond.types) {
          bonded_type = new Type(
            bonded_type.name, bonded_type.element, bonded_type.loc);
          if (bonded_type.equals(t)) {
            continue;
          }
          updates_p.push(send_update(true, op, bonded_type, t, args));
        }
      }

      return Promise.all(updates_p);
    });

  // Upwards propagation
  const upwards_p = mean.db.collection("tbonds")
    .find({subtype: t})
    .toArray()
    .then(type_bonds => {
      console.log("got " + type_bonds.length + " tbonds for upwards prop");
      const updates_p = [];

      // The same bonded type can appear multiple times and we only want to send
      // one update to that one
      let bonded_types = {};
      for (let type_bond of type_bonds) {
        console.log("processing " + JSON.stringify(type_bond));
        for (let bonded_type of type_bond.types) {
          bonded_types[JSON.stringify(bonded_type)] = true;
        }
      }
      for (let bonded_type_str of Object.keys(bonded_types)) {
        const bonded_type_obj = JSON.parse(bonded_type_str);
        const bonded_type = new Type(
          bonded_type_obj.name, bonded_type_obj.element, bonded_type_obj.loc);
        updates_p.push(send_update(false, op, bonded_type, t, args));
      }

      return Promise.all(updates_p);
    });

  return Promise.all([downwards_p, upwards_p]);
}

function send_update(
    downwards: boolean, op: string, dst: Type, src: Type, args: any) {
  const atom_id = args.atom_id;

  if (op === "new") {
    const atom = args.atom;
    console.log(
         "Sending update to element " + dst.element + " dst type " +
         JSON.stringify(dst) + " have atom <" + atom + ">");
    return transform_atom(downwards, dst, src, atom)
      .then(transformed_atom => {
        const atom_str = transformed_atom.replace(/"/g, "\\\"");
        console.log("now have <" + atom_str + ">");
        return post(dst.loc, `{
            _dv_${op}_${dst.name.toLowerCase()}(
              atom_id: "${atom_id}", atom: "${atom_str}")
        }`);
      });
  } else { // update
    const update = args.update;
    console.log(
         "Sending update to element " + dst.element + " dst type " +
         JSON.stringify(dst) + " have update <" + update + ">");
    return transform_update(downwards, dst, src, update)
      .then(transformed_update => {
        const update_str = transformed_update.replace(/"/g, "\\\"");
        console.log("now have <" + update_str + ">");
        return post(dst.loc, `{
            _dv_${op}_${dst.name.toLowerCase()}(
              atom_id: "${atom_id}", update: "${update_str}")
        }`);
      });
  }
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

function transform_atom(downwards: boolean, dst: Type, src: Type, atom) {
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

  return get(dst.loc, query).then(res => {
    const dst_type_info = JSON.parse(res).data.__type;
    return get_name_map(src, dst)
        .then(name_map => {
          const parsed_atom = JSON.parse(atom);
          let transformed_atom = {};
          for (let dst_f of dst_type_info.fields) {
            console.log(
              "Looking at " + JSON.stringify(dst_f) + " for dst " +
              JSON.stringify(dst) + " parsed atom " + atom + " name_map " +
              JSON.stringify(name_map));
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
            JSON.stringify(name_map) + " for dst " + JSON.stringify(dst));
          return transformed_atom_str;
        });
  });
}


function transform_update(downwards: boolean, dst: Type, src: Type, update) {
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


  return get(dst.loc, query)
    .then(res => {
      const dst_type_info = JSON.parse(res).data.__type;
      const dst_type_fields = dst_type_info.fields.map(f => f.name);
      return get_name_map(src, dst, true)
        .then(name_map => {
          const parsed_update = JSON.parse(update);
          let transform_up = {};
          // { operator1: {field: value, ...}, operator2: {field: value, ...}
          for (const update_f of Object.keys(parsed_update)) {
            transform_up[update_f] = {};
            for (const field_f of Object.keys(parsed_update[update_f])) {
              if (dst_type_fields.indexOf(field_f) > -1) {
                transform_up[update_f][field_f] = (
                  parsed_update[update_f][field_f]);
              } else if (name_map[field_f] !== undefined) {
                const map_f = name_map[field_f];
                transform_up[update_f][map_f] = (
                  parsed_update[update_f][field_f]);
              }
            }
          }
          const transform_up_str = JSON.stringify(transform_up);
          console.log(
            "trasnformed update str " + transform_up_str + " used name map " +
            JSON.stringify(name_map) + " for dst " + JSON.stringify(dst));
          return transform_up_str;
        });
  });
}


// name_map: dst -> src
function get_name_map_downwards(src, dst, reverse = false) {
  return mean.db.collection("fbonds")
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
        if (reverse) {
          name_map[src_fbond_info.name] = dst_fbond_info.name;
        } else {
          name_map[dst_fbond_info.name] = src_fbond_info.name;
        }
      }
      return name_map;
    });
}

function get_name_map_upwards(src, dst, reverse = false) {
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
  return mean.db.collection("fbonds")
    .aggregate([
      {$match: {fields: {$elemMatch: {"type": dst}}}},
      {$match: {"subfield.type": src}},
    ])
    .toArray()
    .then(fbonds => {
      let name_map = {};
      for (let fbond of fbonds) {
        console.log(
          "processing fbond " + JSON.stringify(fbond) + " for dst " +
          JSON.stringify(dst));
        // a given type can only appear once in a field bond
        let dst_fbond_info;
        for (let finfo of fbond.fields) {
          if (dst.equals(finfo.type)) {
            dst_fbond_info = finfo;
          }
        }
        if (reverse) {
          name_map[fbond.subfield.name] = dst_fbond_info.name;
        } else {
          name_map[dst_fbond_info.name] = fbond.subfield.name;
        }
      }
      console.log(
        "got " + fbonds.length + " back, used " + JSON.stringify(dst) +
        " and " + JSON.stringify(src) + " name map " +
        JSON.stringify(name_map));
      return name_map;
    });
}

function get_null(t) {
  let ret;
  // console.log("getting null of " + JSON.stringify(t));
  if (t.kind === "LIST") {
    ret = [];
  } else if (
      (t.kind === "NON_NULL" && t.ofType.name === "String") ||
      (t.name === "String")) {
    ret = "";
  }
  // console.log("got " + ret);
  return ret;
}

function post(loc, query) {
  const query_str = query.replace(/ /g, "");

  const options = {
    uri: loc + "/graphql",
    method: "post",
    body: {
      query: "mutation " + query_str
    },
    json: true
  };

  console.log(
    "using options " + JSON.stringify(options) +
    " for query <" + query_str + ">");
  return rp(options);
}

function get(loc, query) {
  const query_str = encodeURIComponent(
    query.replace(/ /g, "").replace(/\n/g, ""));

  const options = {
    uri: loc + `/graphql?query=query+${query_str}`
  };

  console.log(
    "using options " + JSON.stringify(options) +
    " for query <" + query_str + ">");
  return rp(options);
}
