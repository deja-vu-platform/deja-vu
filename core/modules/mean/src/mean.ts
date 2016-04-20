/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
// the mongodb tsd typings are wrong and we can't use them with promises
let mongodb = require("mongodb");
import * as http from "http";
let command_line_args = require("command-line-args");
let express_graphql = require("express-graphql");


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


export interface MeanConfig {
  graphql_schema?: any;
  init_db?: (db, debug) => void;
}


export class Mean {
  db; //: mongodb.Db;
  app: express.Express;
  composer: Composer;

  constructor(public name: string, config: MeanConfig) {
    const opts = cli.parse();
    const loc = `http://${opts.wshost}:${opts.wsport}`;

    console.log(`Starting MEAN ${name} at ${loc}`);

    const server = new mongodb.Server(
      opts.dbhost, opts.dbport, {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(
        `${name}-${opts.wshost}-${opts.wsport}-db`, server, {w: 1});
    this.db.open((err, db) => {
      if (err) {
        console.log("Error opening mongodb");
        throw err;
      }
      if (config.init_db) {
        console.log(`Initializing db for MEAN ${name}`);
        config.init_db(db, opts.debugdata);
      }
    });

    this.app = express();
    this.app.use(morgan("dev"));

    if (opts.servepublic) {
      console.log(`Serving public folder for MEAN ${name} at ${loc}`);
      this.app.use(express.static("./dist/public"));
    };
    if (config.graphql_schema) {
     console.log(`Serving graphql schema for MEAN ${name} at ${loc}`);
     const gql = express_graphql({schema: config.graphql_schema, pretty: true});
     this.app.options("/graphql", this._cors);
     this.app.get("/graphql", this._cors, gql);
     this.app.post("/graphql", this._cors, gql);
    }

    this.app.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });

    this.composer = new Composer(
        name, opts.bushost, opts.busport, loc);
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


export class Composer {
  constructor(
      private _element: string,
      private _hostname: string, private _port: number,
      private _loc: string) {}

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

  update_atom(t: any /* GraphQLObjectType */, atom_id: string, new_atom: any) {
    console.log("sending up atom to composer");
    const atom_str = JSON.stringify(
        this._filter_atom(t, new_atom)).replace(/"/g, "\\\"");
    this._post(`{
      updateAtom(
        type: {
          name: "${t.name}", element: "${this._element}", loc: "${this._loc}"
        },
        atom_id: "${atom_id}",
        atom: "${atom_str}")
    }`);
  }

  rm_atom(t: any /* GraphQLObjectType */, id: string) {
    console.log("sending rm atom to composer");
    this._post(`rm`);
  }

  config(query) {
    this._post(query);
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
