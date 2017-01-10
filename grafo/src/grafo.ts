import {Promise} from "es6-promise";
const graphql = require("graphql");

import * as _u from "underscore";


export class Grafo {
  types: any = {};
  user_queries: any = {};
  mutations: any = {};

  constructor(private db) {}

  init() {
    return this.db.open()
      .then(_ => Promise
        .all(_u.map(_u.keys(this.types), t_name => this.db
               .createCollection(this._col_name(t_name))
               .then(col => col.remove())
               .then(rcount => {
                 const col_name = this._col_name(t_name);
                 console.log(`Reset ${col_name}`);
                 console.log(`Removed ${rcount} ${col_name}`);
                 return true;
               })
            )))
      .catch(e => console.log(e));
  }

  add_type(t) {
    this.types[t.name] = t;
    return this;
  }

  add_query(q) {
    this.user_queries[q.name] = q;
    return this;
  }

  add_mutation(m) {
    this.mutations[m.name] = m;
    return this;
  }

  schema() {
    // Process types
    this.types = _u.mapObject(this.types, (t, unused_t_name) => {
      this._check_fields_are_valid(t.fields);
      this._add_default_id_fields(t);
      this._add_resolve_functions(t.fields);
      this._build_gql_type(t);
      return new graphql.GraphQLObjectType(t);
    });

    // Process queries
    const queries = this.user_queries;

    // - Add default queries
    _u.each(this.types, (unused_t, t_name: string) => {
      const query_by_id = t_name.toLowerCase() + "_by_id";
      const query_all = t_name.toLowerCase() + "_all";
      if (queries[query_by_id] === undefined) {
        queries[query_by_id] = this._by_id_query(t_name);
      }
      if (queries[query_all] === undefined) {
        queries[query_all] = {
          "type": "[" + t_name + "]",
          resolve: (root) => this.db
            .collection(this._col_name(t_name)).find().toArray()
        };
      }
    });

    // - Add dummy query if there are no queries
    if (_u.isEmpty(queries)) {
      queries["dummy"] = {
        "type": graphql.GraphQLBoolean,
        resolve: _ => true
      };
    }

    // - Build gql types

    const process_elems = elems => _u.mapObject(elems, (e, unused_e_name) => {
      if (e.type === undefined) {
        throw new Error("Type for " + e.name + " is undefined");
      }
      e.type = this._get_gql_type(e.type);
      e.args = _u.mapObject(e.args, (arg, unused_arg_name) => {
        arg.type = this._get_gql_type(arg.type);
        return arg;
      });
      return e;
    });

    const processed_queries = () => process_elems(queries);

    // Process mutations
    //
    // - Build gql types

    let processed_mutations = {};
    if (!_u.isEmpty(this.mutations)) {
      processed_mutations = () => process_elems(this.mutations);
    }

    const schema = {};
    schema["query"] = new graphql.GraphQLObjectType({
      name: "Query", fields: processed_queries
    });
    if (!_u.isEmpty(this.mutations)) {
      schema["mutation"] = new graphql.GraphQLObjectType({
        name: "Mutation", fields: processed_mutations
      });
    }
    const ret = new graphql.GraphQLSchema(schema);
    console.log(graphql.printSchema(ret));
    return ret;
  }

  private _col_name(t_name) {
    return t_name.toLowerCase() + "s";
  }

  private _by_id_query(t_name: string) {
    return {
      "type": t_name,
      args: {
        atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      },
      resolve: (root, {atom_id}) => this.db
        .collection(this._col_name(t_name)).findOne({atom_id: atom_id})
    };
  }

  private _check_fields_are_valid(fields) {
    _u.each(fields, (f: any, f_name: string) => {
      if (f.type === undefined) {
        throw new Error("Type for " + f_name + " is undefined");
      }

      if (!_u.isString(f.type)) return;

      const match = f.type.match(/\[(\w+)\]/);
      const t_name = match !== null ? match[1] : f.type;
      if (this.types[t_name] === undefined) {
        throw new Error("Type " + t_name + " doesn't exist");
      }
    });
  }

  private _add_default_id_fields(t) {
    const default_id_fields = {};
    _u.each(t.fields, (f: any, f_name: string) => {
      if (!_u.isString(f.type)) return f;

      const match = f.type.match(/\[(\w+)\]/);
      if (match !== null) {
        const t_name: string = match[1];
        default_id_fields[t_name.toLowerCase() + "_by_id"] = this.
          _by_id_query(t_name);
      }
    });
    _u.extendOwn(t.fields, default_id_fields);
  }

  private _add_resolve_functions(fields) {
    _u.each(fields, (f: any, f_name: string) => {
      if (!_u.isString(f.type)) return f;

      const match = f.type.match(/\[(\w+)\]/);
      if (match !== null) {
        const t_name: string = match[1];
        if (f.resolve === undefined) {
          f.resolve = src => {
            const collection = this.db.collection(this._col_name(t_name));
            const target = src[f_name];
            if (target === undefined || _u.isEmpty(target)) return [];
            return collection
              .find({atom_id: {$in: target.map(t => t.atom_id)}})
              .toArray();
          };
        }
      } else {
        const t_name: string = f.type;
        if (f.resolve === undefined) {
          f.resolve = src => this.db.collection(this._col_name(t_name))
            .findOne({atom_id: src[f_name].atom_id});
        }
      }
    });
  }

  private _build_gql_type(t) {
    const fields = t.fields;
    t.fields = () => {
      _u.each(fields, (f: any, f_name: string) => {
        f.type = this._get_gql_type(f.type);
      });
      return fields;
    };
  }

  private _get_gql_type(t) {
    if (!_u.isString(t)) return t;

    const match = t.match(/\[(\w+)\]/);
    let ret;
    if (match !== null) {
      const t = this.types[match[1]];
      ret = new graphql.GraphQLList(t);
    } else {
      ret = this.types[t];
    }
    return ret;
  }
}
