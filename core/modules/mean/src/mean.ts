/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
import * as mongodb from "mongodb";
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

  {name: "servepublic", type: Boolean, defaultValue: true},
  {name: "debugdata", type: Boolean, defaultValue: true}
]);


export interface MeanConfig {
  graphql_schema?: any;
  init_db?: (db, debug) => void;
}


export class Mean {
  db: mongodb.Db;
  app: express.Express;
  composer: Composer;

  constructor(public name: string, config: MeanConfig) {
    const opts = cli.parse();

    console.log(`Starting MEAN ${name}`);

    const server = new mongodb.Server(
      opts.dbhost, opts.dbport, {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(`${name}db`, server, {w: 1});
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
      console.log(`Serving public folder for MEAN ${name}`);
      this.app.use(express.static("./dist/public"));
    };
    if (config.graphql_schema) {
     console.log(`Serving graphql schema for MEAN ${name}`);
     const gql = express_graphql({schema: config.graphql_schema, pretty: true});
     this.app.options("/graphql", this._cors);
     this.app.get("/graphql", this._cors, gql);
     this.app.post("/graphql", this._cors, gql);
    }

    this.app.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });

    this.composer = new Composer(opts.bushost, opts.busport);
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

export interface Type {
  element: string;
  name: string;
}

export class Composer {
  constructor(private _hostname: string, private _port: number) {}

  new_atom(t: Type, atom: any) {
    console.log("sending new atom to composer");
    const atom_str = JSON.stringify(atom).replace(/"/g, "\\\"");
    this._post(`{
      newAtom(
        type: {element: "${t.element}", name: "${t.name}"},
        atom: "${atom_str}")
    }`);
  }

  update_atom(t: Type, id: string, new_atom: any) {
    console.log("sending up atom to composer");
    this._post(`update`);
  }

  rm_atom(t: Type, id: string) {
    console.log("sending rm atom to composer");
    this._post(`rm`);
  }

  config(query) {
    this._post(query);
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
        console.log(`got ${body} back from the bus`);
      });
    });
    req.on("error", err => console.log(err));

    req.write(post_data);
    req.end();
  }
}
