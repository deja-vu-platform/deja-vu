/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
// the mongodb tsd typings are wrong and we can't use them with promises
const mongodb = require("mongodb");
import * as http from "http";
const command_line_args = require("command-line-args");
const express_graphql = require("express-graphql");
const graphql = require("graphql");


const cli = command_line_args([
  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "wshost", type: String, defaultValue: "localhost"},
  {name: "wsport", type: Number, defaultValue: 3000},

  {name: "bushost", type: String, defaultValue: "localhost"},
  {name: "busport", type: Number, defaultValue: 3001},

  {name: "servepublic", type: Boolean},
  {name: "debugdata", type: Boolean}
]);


export class Mean {
  db; //: mongodb.Db;
  ws: express.Express;
  loc: string;
  bushost: string;
  busport: number;

  constructor(public name: string, init_db?: (db, debug) => void) {
    const opts = cli.parse();
    this.loc = `http://${opts.wshost}:${opts.wsport}`;
    this.bushost = opts.bushost;
    this.busport = opts.busport;

    console.log(`Starting MEAN ${name} at ${this.loc}`);

    const server = new mongodb.Server(
      opts.dbhost, opts.dbport, {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(
        `${name}-${opts.wshost}-${opts.wsport}-db`, server, {w: 1});
    this.db.open((err, db) => {
      if (err) {
        console.log("Error opening mongodb");
        throw err;
      }
      if (init_db !== undefined) {
        console.log(`Initializing db for MEAN ${name}`);
        init_db(db, opts.debugdata);
      }
    });

    this.ws = express();
    this.ws.use(morgan("dev"));

    if (opts.servepublic) {
      console.log(`Serving public folder for MEAN ${name} at ${this.loc}`);
      this.ws.use(express.static("./dist/public"));
    };

    this.ws.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });
  }
}

export namespace Helpers {
  export function serve_schema(ws, graphql_schema) {
    console.log(`Serving graphql schema for MEAN`);
    const gql = express_graphql({
      schema: graphql_schema,
      pretty: true,
      formatError: e => ({
        message: e.message,
        locations: e.locations,
        stack: e.stack
      })
    });
    ws.options("/graphql", this.cors);
    ws.get("/graphql", this.cors, gql);
    ws.post("/graphql", this.cors, gql);
  }

  export function cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
  }

  export function resolve_create(
      db: any, item_name: string, col_name?: string,
      transform_fn?: (atom: any) => any) {
    if (col_name === undefined) col_name = item_name + "s";

    return (_, {atom_id, atom}) => {
      let atom_obj = JSON.parse(atom);
      console.log(
        "got new " + item_name + "(id " + atom_id + ") from bus " + atom);
      atom_obj["atom_id"] = atom_id;
      if (transform_fn !== undefined) atom_obj = transform_fn(atom_obj);

      return db.collection(col_name)
        .insertOne(atom_obj)
        .then(res => res.insertedCount === 1);
    };
  }

  export function resolve_update(
      db: any, item_name: string, col_name?: string) {
    if (col_name === undefined) col_name = item_name + "s";

    return (_, {atom_id, update}) => {
      let update_obj = JSON.parse(update);
      console.log(
        "got update " + item_name + "(id " + atom_id + ") from bus " + update);

      return db.collection(col_name)
        .updateOne({atom_id: atom_id}, update_obj)
        .then(res => res.matchedCount === 1 && res.modifiedCount === 1);
    };
  }
}


export class ServerBus {
  constructor(
      private _element: string,
      private _loc: string,
      private _ws: express.Express,
      private _hostname: string, private _port: number,
      private _handlers: any) {

    const build_field = (action, t, handlers) => {
      const ret = {
        "type": graphql.GraphQLBoolean,
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: handlers[t][action]
      };
      let key = "atom";
      if (action === "update") key = "update";
      ret["args"][key] = {
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
    const gql = express_graphql({
      schema: new graphql.GraphQLSchema({
          query: new graphql.GraphQLObjectType({
            name: "Query",
            fields: {
              root: {"type": graphql.GraphQLString, resolve: "tbd"}
            }
          }),
          mutation: new graphql.GraphQLObjectType({
              name: "Mutation",
              fields: mut
          })
      }),
      pretty: true,
      formatError: e => ({
        message: e.message,
        locations: e.locations,
        stack: e.stack
      })
    });
    _ws.options("/dv-bus", Helpers.cors);
    _ws.get("/dv-bus", Helpers.cors, gql);
    _ws.post("/dv-bus", Helpers.cors, gql);
  }

  new_atom(t: any /* GraphQLObjectType */, atom_id: string, atom: any) {
    console.log("sending new atom to composer");
    const atom_str = JSON.stringify(
        this._filter_atom(t, atom)).replace(/"/g, "\\\"");
    console.log("t is " + t.name);
    console.log("atom id is " + atom_id);
    this._post(`{
      newAtom(
        type: {
          name: "${t.name}", element: "${this._element}", loc: "${this._loc}"
        },
        atom_id: "${atom_id}",
        atom: "${atom_str}")
    }`);
  }

  // no filtering update
  update_atom(t: any /* GraphQLObjectType */, atom_id: string, update: any) {
    console.log("sending up atom to composer");
    const update_str = JSON.stringify(update).replace(/"/g, "\\\"");
    this._post(`{
      updateAtom(
        type: {
          name: "${t.name}", element: "${this._element}", loc: "${this._loc}"
        },
        atom_id: "${atom_id}",
        update: "${update_str}")
    }`);
  }

  rm_atom(t: any /* GraphQLObjectType */, id: string) {
    console.log("sending rm atom to composer");
    this._post(`rm`);
  }

  config(comp_info) {
    // JSON.stringify quotes properties and graphql doesn't like that
    const str_t = t => (
        `{name: "${t.name}", element: "${t.element}", loc: "${t.loc}"}`);
    const str_f = f => (`{
      name: "${f.name}",
      type: ${str_t(f.type)}
    }`);
    for (const tbond of comp_info.tbonds) {
      this._post(`{
        newTypeBond(
          types: ${"[" + tbond.types.map(str_t).join(",") + "]"},
          subtype: ${str_t(tbond.subtype)})
      }`);
    }
    for (const fbond of comp_info.fbonds) {
      this._post(`{
        newFieldBond(
          fields: ${"[" + fbond.fields.map(str_f).join(",") + "]"},
          subfield: ${str_f(fbond.subfield)})
      }`);
    }
  }

  private _filter_atom(t: any, atom: any) {
    let filtered_atom = {};
    for (const f of Object.keys(t._fields)) {
      const atom_f = atom[f];

      let filtered_atom_f = {};
      if (Array.isArray(atom_f)) {   // list type
        filtered_atom_f = this._filter_list(atom_f);
      } else if (typeof atom_f === "object") {  // object type
        filtered_atom_f["atom_id"] = atom_f["atom_id"];
      } else {  // scalar type
        filtered_atom_f = atom_f;
      }

      filtered_atom[f] = filtered_atom_f;
    }
    console.log(
        "BEFORE FILTER <" + JSON.stringify(atom) + "> AFTER FILTER <" +
        JSON.stringify(filtered_atom) + ">");
    return filtered_atom;
  }

  private _filter_list(l: Array<any>) {
    return l.map(atom => {
      let filtered_atom = {};
      if (typeof atom === "object") {
        filtered_atom["atom_id"] = atom["atom_id"];
      } else if (atom["Symbol.iterator"] === "function") {
        filtered_atom = this._filter_list(atom);
      } else {
        filtered_atom = atom;
      }
      return filtered_atom;
    });
  }

  private _post(query) {
    const query_str = query.replace(/ /g, "");
    const post_data = JSON.stringify({query: "mutation " + query_str});

    const options = {
      hostname: this._hostname,
      port: this._port,
      method: "post",
      path: "/graphql",
      headers: {
        "Content-type": "application/json",
        "Content-length": post_data.length
      }
    };

    console.log("using options " + JSON.stringify(options));
    console.log("query is <" + query_str + ">");
    const req = http.request(options);
    req.on("response", res => {
      let body = "";
      res.on("data", d => { body += d; });
      res.on("end", () => {
        console.log(
          `got ${body} back from the bus for query ${query_str},
           options ${JSON.stringify(options)}`);
      });
    });
    req.on("error", err => console.log(err));

    req.write(post_data);
    req.end();
  }
}
