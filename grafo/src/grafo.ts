/// <reference path="../typings/tsd.d.ts" />
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
    const process_type = (f, f_name) => {
      if (f.type === undefined) {
        throw new Error("Type for " + f_name + " is undefined");
      }
      if (!_u.isString(f.type)) return f;

      const match = f.type.match(/\[(\w+)\]/);
      if (match !== null) {
        const t_name: string = match[1];
        const f_type = this.types[t_name];
        if (f_type === undefined) {
          throw new Error("Type " + t_name + " doesn't exist");
        }
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
        f.type = new graphql.GraphQLList(f_type);
      } else {
        const t_name: string = f.type;
        if (f.resolve === undefined) {
          f.resolve = src => this.db.collection(this._col_name(t_name))
            .findOne({atom_id: src[f_name].atom_id});
        }
        f.type = this.types[t_name];
        if (f.type === undefined) {
          throw new Error("Type " + t_name + " doesn't exist");
        }
      }
      return f;
    };

    this.types = _u.mapObject(this.types, t => {
      let f = t.fields;
      if (_u.isFunction(f)) {
        f = t.fields();
      }
      t.fields = () => _u.mapObject(f, process_type);
      return t;
    });
    this.types = _u.mapObject(this.types, t => {
      return new graphql.GraphQLObjectType(t);
    });

    const default_queries = {};
    _u.each(this.types, (t, t_name: string) => {
      default_queries[t_name.toLowerCase() + "_by_id"] = {
        "type": t,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {atom_id}) => this.db
          .collection(this._col_name(t_name)).findOne({atom_id: atom_id})
      };

      default_queries[t_name.toLowerCase() + "_all"] = {
        "type": new graphql.GraphQLList(t),
        resolve: (root) => this.db
          .collection(this._col_name(t_name)).find().toArray()
      };
    });

    const get_type = (t: string) => {
      if (!_u.isString(t)) return t;

      const match = t.match(/\[(\w+)\]/);
      let ret;
      if (match !== null) {
        const t = this.types[match[1]];
        if (t === undefined) {
          throw new Error("Type " + match[1] + " doesn't exist");
        }
        ret = new graphql.GraphQLList(t);
      } else {
        ret = this.types[t];
        if (ret === undefined) {
          throw new Error("Type " + t + " doesn't exist");
        }
      }
      return ret;
    };

    const process_elems = elems => _u.mapObject(elems, e => {
      if (e.type === undefined) {
        throw new Error("Type for " + e.name + " is undefined");
      }
      e.type = get_type(e.type);
      e.args = _u.mapObject(e.args, arg => {
        arg.type = get_type(arg.type);
        return arg;
      });
      return e;
    });

    this.user_queries = process_elems(this.user_queries);
    this.mutations = process_elems(this.mutations);

    const queries = {};
    _u.extendOwn(queries, default_queries, this.user_queries);
    const schema = {};
    if (!_u.isEmpty(queries)) {
      schema["query"] = new graphql.GraphQLObjectType({
        name: "Query", fields: queries
      });
    }
    if (!_u.isEmpty(this.mutations)) {
      schema["mutation"] = new graphql.GraphQLObjectType({
        name: "Mutation", fields: this.mutations
      });
    }

    return new graphql.GraphQLSchema(schema);
  }

  private _col_name(t_name) {
    return t_name.toLowerCase() + "s";
  }
}
