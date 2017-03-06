import * as express from "express";
const express_graphql = require("express-graphql");
const graphql = require("graphql");
const rp = require("request-promise");

import * as _u from "underscore";
import * as _ustr from "underscore.string";


export interface Type {
  name: string;
  fqelement: string;
}

export interface Field {
  name: string;
  "of": Type;
}

export interface TypeBond {
  types: Type[];
  subtype: Type;
}

export interface FieldBond {
  fields: Field[];
  subfield: Field;
}

export interface CompInfo {
  tbonds: TypeBond[];
  fbonds: FieldBond[];
}

/* Route to which other cliches will issue requests to report state updates */
const BUS_PATH = "/dv-bus";

/**
 * The server bus is used to keep the servers of the different cliches in
 * sync. This class provides a way for a cliche to report state updates, and to
 * provide handlers to process updates reported by other cliches.
 **/
export class ServerBus {
  private _dispatcher: Dispatcher;
  /**
   * Args:
   *   - the fully-qualified name of the cliche (fqelement)
   *   - the web server to use to mount the BUS_PATH route (_ws)
   *   - a set of handlers to process state updates from other cliches
   *     (_handlers)
   *   - the bond information (comp_info)
   *   - locs (the location of the other cliches)
   **/
  constructor(
      fqelement: string,
      private _ws: express.Express,
      private _handlers: any, comp_info: CompInfo, locs: any) {
    if (comp_info !== undefined) {
      this._dispatcher = new Dispatcher(fqelement, comp_info, locs);
    }

    const build_field = (action, t, handlers) => {
      const forward_wrap = handler => {
        if (handler === undefined) {
          console.log("WARNING: no handler provided for " + action + " " + t);
          handler = _ => Promise.resolve(true);
        }
        return (_, args) => handler(_u.omit(args, "forward"))
          .then(_ => {
            if (args.forward !== undefined || args.forward) {
              if (args.create !== undefined) {
                console.log(
                  `Forward requested for create(${t}, ${args.atom_id}, ` +
                  `${args.create}) of ${fqelement}`);
                return this.create_atom(
                  t, args.atom_id, JSON.parse(args.create));
              } else if (args.update !== undefined) {
                console.log(
                  `Forward requested for update(${t}, ${args.atom_id}, ` +
                  `${args.update}) of ${fqelement}`);
                return this.update_atom(
                  t, args.atom_id, JSON.parse(args.update));
              } else {
                console.log("rm");
              }
            }
            return Promise.resolve(true);
          });
      };
      const ret = {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          forward: {"type": graphql.GraphQLBoolean}
        },
        resolve: forward_wrap(handlers[t][action])
      };
      ret.args[action] = {
        "type": new graphql.GraphQLNonNull(graphql.GraphQLString)
      };
      return ret;
    };
    const mut = {};
    for (let t of Object.keys(_handlers)) {
      mut["create_" + t] = build_field("create", t, _handlers);
      mut["update_" + t] = build_field("update", t, _handlers);
      // mut["delete_" + t] = build_field("delete", t, _handlers);
    }
    const schema = {
      query: new graphql.GraphQLObjectType({
        name: "Query",
        fields: {
          root: {"type": graphql.GraphQLString, resolve: "tbd"}
        }
      })
    };
    if (!_u.isEmpty(mut)) {
      schema["mutation"] = new graphql.GraphQLObjectType({
        name: "Mutation",
        fields: mut
      });
    }
    const gql = express_graphql({
      schema: new graphql.GraphQLSchema(schema),
      pretty: true,
      formatError: e => ({
        message: e.message,
        locations: e.locations,
        stack: e.stack
      })
    });
    _ws.options(BUS_PATH, this._cors);
    _ws.get(BUS_PATH, this._cors, gql);
    _ws.post(BUS_PATH, this._cors, gql);
  }

  /**
   *  Report the creation of a new atom
   *
   *  Args:
   *     - the type of the new atom (t_name)
   *     - the id of the new atom (atom_id)
   *     - the new atom (create)
   **/
  create_atom(t_name: string, atom_id: string, create: any): Promise<boolean> {
    console.log("sending new atom");
    if (this._dispatcher === undefined) {
      return Promise.resolve(true);
    }
    return this._dispatcher.create_atom(
        _ustr.capitalize(t_name), atom_id, create);
  }
  /**
   * Report the update of an existing atom
   *
   * Args:
   *   - the type of the atom to update (t_name)
   *   - the id of the atom to update (atom_id)
   *   - the update to perform (update). The bus uses mongodb's update operators
   **/
  update_atom(t_name: string, atom_id: string, update: any): Promise<boolean> {
    console.log("sending up atom");
    if (this._dispatcher === undefined) {
      return Promise.resolve(true);
    }
    return this._dispatcher.update_atom(
        _ustr.capitalize(t_name), atom_id, update);
  }
  /**
   * Report the removal of an atom
   *
   * Args:
   *   - the type of the atom to remove (t_name)
   *   - the id of the atom to remove (atom_id)
   **/
  remove_atom(t_name: string, atom_id: string) {
    console.log("sending remove atom");
    if (this._dispatcher === undefined) {
      return Promise.resolve(true);
    }
    return this._dispatcher.remove_atom(_ustr.capitalize(t_name), atom_id);
  }


  private _cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
  }
}


/**
 * This class is used by the server bus to dispatch state reports
 **/
class Dispatcher {
  create_atom: (t_name: string, atom_id: string, create: any) =>
    Promise<boolean>;
  update_atom: (t_name: string, atom_id: string, update: string) =>
    Promise<boolean>;
  remove_atom: (t_name: string, atom_id: string) => Promise<boolean>;

  private _dispatch_table;
  private _str_t;

  constructor(private _fqelement: string, comp_info: CompInfo, private _locs) {
    this.create_atom = this._process("create", this._transform_create);
    this.update_atom = this._process("update", this._transform_update);

    this._str_t = t => JSON.stringify(t);
    // Build dispatch table
    this._dispatch_table = _u.chain(comp_info.tbonds)
      .filter(tbond => _u.chain(tbond.types).union([tbond.subtype])
          .pluck("fqelement").contains(this._fqelement).value())
      .map(tbond => _u.chain(tbond.types).union([tbond.subtype])
          .reduce((memo, t) => {
            if (t.fqelement === this._fqelement) {
              // Multiple types of the same fqelement can be part of the same
              // bond
              memo.names.push(t.name);
            } else {
              memo.targets[this._str_t(t)] = {};
            }
            return memo;
          }, {names: [], targets: {}})
          .value())
      .reduce((memo, {names, targets}) => {
        for (const name of names) {
          if (memo[name] === undefined) memo[name] = {};
          memo[name] = _u.extendOwn(memo[name], targets);
        }
        return memo;
      }, {})
      .value();

    _u.chain(comp_info.fbonds)
      .filter(fbond => _u.chain(fbond.fields).union([fbond.subfield])
          .pluck("of").pluck("fqelement").contains(this._fqelement).value())
      .map(fbond => _u.chain(fbond.fields).union([fbond.subfield])
          .reduce((memo, f) => {
            if (f.of.fqelement === this._fqelement) {
              // Multiple fields of the same fqelement can be part of the same
              // bond
              memo.our_fields.push({fname: f.name, tname: f.of.name});
            } else {
              memo.fields.push(f);
            }
            return memo;
          }, {our_fields: [], fields: []})
          .value())
      .each(obj => {
        for (const f of obj.fields) {
          for (const {fname, tname} of obj.our_fields) {
            const t_str = this._str_t(f.of);
            const field_map = {};
            field_map[fname] = f.name;
            _u.extend(this._dispatch_table[tname][t_str], field_map);
          }
        }
      });

    console.log(
        "Dispatch table for " + this._fqelement + ":" +
        JSON.stringify(this._dispatch_table));
  }

  private _process(op: string, transform_fn: any) {
    return (t_name: string, atom_id: string, info: any) => Promise.all(
        _u.values(_u.mapObject(
            this._dispatch_table[t_name],
            (field_map, target_str) => {
              const target = JSON.parse(target_str);
              const transformed_info = transform_fn(info, field_map);
              if (op === "update" && _u.isEmpty(transformed_info)) {
                console.log("No need to send update to " +  target_str);
                return Promise.resolve(true);
              }
              const info_str = JSON.stringify(transformed_info)
                   .replace(/"/g, "\\\"");
              return this._post(this._locs[target.fqelement], `{
                  ${op}_${target.name.toLowerCase()}(
                    atom_id: "${atom_id}", ${op}: "${info_str}")
              }`);
            }))).then(_ => true);
  }

  private _transform_create(atom: any, field_map: string) {
    return _u.reduce(_u.keys(atom), (memo, field: string) => {
        const target_field = field_map[field];
        if (target_field !== undefined) {
          memo[target_field] = atom[field];
        }
        return memo;
    }, {});
  }

  private _transform_update(update: any, field_map: string) {
    // { operator1: {field: value, ...}, operator2: {field: value, ...} }
    return _u.reduce(
            _u.keys(update),
            (memo, op: string) => {
              const op_update_obj = update[op];
              const transformed_op_update_obj = _u
                  .reduce(_u.keys(op_update_obj), (memo, field: string) => {
                    // field could have dots (the update could be modifying
                    // nested objs)
                    const transformed_field: string = _u.chain(field.split("."))
                      .map(subfield => {
                        if (!_u.isNaN(Number(subfield))) {
                          return subfield;
                        } else {
                          return field_map[subfield];
                        }
                      })
                      .reduce((memo: string, subfield: string): string => {
                        if (memo === undefined || subfield === undefined)  {
                          return undefined;
                        }
                        memo = memo + "." + subfield;
                        return memo;
                      })
                      .value();
                    if (transformed_field !== undefined) {
                      memo[transformed_field] = op_update_obj[field];
                    }
                    return memo;
                  }, {});

              if (!_u.isEmpty(transformed_op_update_obj)) {
                memo[op] = transformed_op_update_obj;
              }
              return memo;
            }, {});
  }

  private _post(loc, query) {
    const query_str = query.replace(/ /g, "");

    const options = {
      uri: loc + BUS_PATH,
      method: "post",
      body: {
        query: "mutation " + query_str
      },
      json: true
    };

    console.log(
      "using options " + JSON.stringify(options) +
      " for query <" + query_str + ">");

    let attempt = 1;
    const req = () => rp(options)
      .then(body => {
        console.log(body);
        return body;
      })
      .catch(reason => {
        if (reason.error.code === "ECONNREFUSED") {
          ++attempt;
          const delay = Math.floor(Math.random() * Math.pow(2, attempt)) + 2;
          console.log(`Failed to reach ${loc}, will retry in ${delay}s`);
          return new Promise(r => setTimeout(r, delay * 1000)).then(_ => req());
        } else {
          console.log(
            `For ${loc} q ${query_str} got error: ` +
            `${JSON.stringify(reason.error)}`);
        }
        return Promise.resolve("");
      });
    return req();
  }
}
