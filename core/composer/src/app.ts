/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
const rp = require("request-promise");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";

import * as _ from "underscore";


const mean = new Mean(
  "composer",
  (db, debug) => {
    db.createCollection("tbonds", (err, tbonds) => {
      if (err) throw err;
      console.log("Resetting tbonds collection");
      tbonds.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} tbonds`);
      });
    });
    db.createCollection("fbonds", (err, fbonds) => {
      if (err) throw err;
      console.log("Resetting fbonds collection");
      fbonds.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} fbonds`);
      });
    });
    db.createCollection("tinfo", (err, tinfo) => {
      if (err) throw err;
      console.log("Resetting tinfo collection");
      tinfo.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} tinfo`);
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
          types.push(subtype);
          console.log("new type bond! " + JSON.stringify(types));
          return mean.db.collection("tbonds")
            .insertOne({types: types})
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
          fields.push(subfield);
          console.log("new field bond! " + JSON.stringify(fields));
          return mean.db.collection("fbonds")
            .insertOne({fields: fields})
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
          atom: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          self_forward: {"type": graphql.GraphQLBoolean}
        },
        resolve: (root, args) => process("new", args)
      },
      updateAtom: {
        "type": graphql.GraphQLBoolean,
        args: {
          "type": {"type": new graphql.GraphQLNonNull(type_input_type)},
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          update: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          self_forward: {"type": graphql.GraphQLBoolean}
        },
        resolve: (root, args) => process("update", args)
      }
    }
  })
});

Helpers.serve_schema(mean.ws, schema);

mean.start();


function process(op: string, args: any) {
  const t: Type = new Type(
    args.type.name, args.type.element, args.type.loc);
  console.log(`${op} atom! ${JSON.stringify(t)} ${JSON.stringify(args)}`);

  return mean.db.collection("tbonds")
    .find({types: {$in: [t.doc]}})
    .toArray()
    .then(type_bonds => {
      console.log("got " + type_bonds.length + " tbonds for propagation");
      const updates_p = [];

      for (let type_bond of type_bonds) {
        console.log("processing " + JSON.stringify(type_bond));
        for (let bonded_type of type_bond.types) {
          bonded_type = new Type(
            bonded_type.name, bonded_type.element, bonded_type.loc);
          if (!args.self_forward && bonded_type.equals(t)) {
            continue;
          }
          updates_p.push(send_update(op, bonded_type, t, args));
        }
      }

      return Promise.all(updates_p);
    });
}

function send_update(op: string, dst: Type, src: Type, args: any) {
  const atom_id = args.atom_id;

  if (op === "new") {
    const atom = args.atom;
    console.log(
         "Computing update to element " + dst.element + " dst type " +
         JSON.stringify(dst) + " have atom <" + atom + ">");
    return transform_atom(dst, src, atom)
      .then(transformed_atom => {
        const atom_str = JSON.stringify(transformed_atom).replace(/"/g, "\\\"");
        console.log("now have <" + atom_str + ">");
        return post(dst.loc, `{
            create_${dst.name.toLowerCase()}(
              atom_id: "${atom_id}", atom: "${atom_str}")
        }`);
      });
  } else { // update
    const update = args.update;
    console.log(
         "Computing update to element " + dst.element + " dst type " +
         JSON.stringify(dst) + " have update <" + update + ">");
    return transform_update(dst, src, update)
      .then(transformed_update => {
        if (_.isEmpty(transformed_update)) {
          console.log("No need to send any updates to " + dst.element);
          return true;
        }
        const update_str = JSON.stringify(transformed_update)
            .replace(/"/g, "\\\"");
        console.log("now have <" + update_str + ">");
        return post(dst.loc, `{
            update_${dst.name.toLowerCase()}(
              atom_id: "${atom_id}", update: "${update_str}")
        }`);
      });
  }
}

class Type {
  doc;

  constructor(
      public name: string, public element: string, public loc: string) {
    this.doc =  {name: this.name, element: this.element, loc: this.loc};
  }

  info() {
    console.log(`Getting schema info for ${this.element}/${this.name}`);
    const query = `{
      __type(name: "${this.name}") {
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
    return mean.db.collection("tinfo")
      .find(this.doc)
      .limit(1)
      .next()
      .then(tinfo => {
        if (tinfo !== null) return tinfo.info;
        console.log(
          `Need to retrieve info for ${this.element}/${this.name} at ` +
          `${this.loc}`);
        return get(this.loc, query)
          .then(res => {
            const info = JSON.parse(res).data.__type;
            const doc = {
                element: this.element, loc: this.loc, name: this.name,
                info: info
            };
            return mean.db.collection("tinfo").insertOne(doc).then(_ => info);
          });
      });
  }

  transform_map(other: Type, reverse = false) {
    return mean.db.collection("fbonds")
      .aggregate([  // get fbonds where both this and other appear
        {$match: {fields: {$elemMatch: {"type": other.doc}}}},
        {$match: {fields: {$elemMatch: {"type": this.doc}}}}
      ])
      .toArray()
      .then(fbonds => {
        let name_map = {};
        for (let fbond of fbonds) {
          // console.log("processing fbond " + JSON.stringify(fbond));
          // a given type can only appear once in a field bond
          let this_fbond_info, other_fbond_info;
          for (let finfo of fbond.fields) {
            if (this.equals(finfo.type)) {
              this_fbond_info = finfo;
            } // not "else if" because could be a self-report
            if (other.equals(finfo.type)) {
              other_fbond_info = finfo;
            }
          }
          if (reverse) {
            name_map[other_fbond_info.name] = this_fbond_info.name;
          } else {
            name_map[this_fbond_info.name] = other_fbond_info.name;
          }
        }
        return name_map;
      });
  }

  equals(other: Type) {
    return (
      this.name.toLowerCase() === other.name.toLowerCase() &&
      this.element.toLowerCase() === other.element.toLowerCase() &&
      this.loc === other.loc);
  }
}

function transform_atom(dst: Type, src: Type, atom) {
  return dst.info().then(dst_type_info => {
    return src.transform_map(dst, true)
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

        console.log(
          "trasnformed atom str " + JSON.stringify(transformed_atom) +
          " used name map " + JSON.stringify(name_map) + " for dst " +
          JSON.stringify(dst));
        return transformed_atom;
      });
  });
}


function transform_update(dst: Type, src: Type, update) {
  return dst.info().then(dst_type_info => {
    const dst_type_fields = dst_type_info.fields.map(f => f.name);
    return src.transform_map(dst)
      .then(name_map => {
        const parsed_update = JSON.parse(update);
        const transform_up = {};
        // { operator1: {field: value, ...}, operator2: {field: value, ...}
        for (const update_f of Object.keys(parsed_update)) {

          for (const field_f of Object.keys(parsed_update[update_f])) {
            // field could have dots (the update could be modifying nested objs)
            const transformed_f = [];
            for (const subfield of field_f.split(".")) {
              if (_.contains(dst_type_fields, subfield)) {
                transformed_f.push(subfield);
              } else if (name_map[subfield] !== undefined) {
                transformed_f.push(name_map[subfield]);
              } else if (!isNaN(Number(subfield)) &&
                         !_.isEmpty(transformed_f)) {
                transformed_f.push(subfield);
              }
            }
            if (!_.isEmpty(transformed_f)) {
              if (transform_up[update_f] === undefined) {
                transform_up[update_f] = {};
              }
              transform_up[update_f][transformed_f.join(".")] = (
                  parsed_update[update_f][field_f]);
            }
          }
        }
        console.log(
          "trasnformed update str " + JSON.stringify(transform_up) +
          " used name map " + JSON.stringify(name_map) + " for dst " +
          JSON.stringify(dst) + " update " + JSON.stringify(update));
        return transform_up;
      });
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
    uri: loc + "/dv-bus",
    method: "post",
    body: {
      query: "mutation " + query_str
    },
    json: true
  };

  console.log(
    "using options " + JSON.stringify(options) +
    " for query <" + query_str + ">");
  return rp(options)
    .then(body => {
      console.log(body);
      return body;
    });
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
