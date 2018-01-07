import * as express from "express";
const express_graphql = require("express-graphql");
const morgan = require("morgan");

// the mongodb tsd typings are wrong and we can't use them with promises
const mongodb = require("mongodb");
const command_line_args = require("command-line-args");
const path = require("path");
import * as _u from "underscore";


const cli = command_line_args([
  {name: "name", type: String},

  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "port", type: String},

  // Mode can be "dev" or "test".  In dev mode the development page is shown,
  // in test mode the main widget is shown
  {name: "mode", type: String, defaultValue: "dev"},
  // True if this is the cliche being run by the user
  {name: "main", type: Boolean}
]);


export class Mean {
  name: string;
  db; //: mongodb.Db;
  ws; //: express.Express;
  debug: boolean;
  private _opts: {
    name: string,
    dbhost: string,
    dbport: number,
    port: number,
    mode: string,
    main: boolean
  };

  constructor() {
    this._opts = cli.parse();
    this.name = this._opts.name;

    console.log(
      `Starting MEAN ${this.name} at ${this._opts.port}`);

    const server = new mongodb.Server(
      this._opts.dbhost, this._opts.dbport,
      {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(`${this.name}-db`, server, {w: 1});

    this.debug = this._opts.mode === "dev" && this._opts.main;
    this.ws = express();
    this.ws.use(morgan("dev"));
  }

  start() {
    if (this._opts.main) {
      console.log(`Serving public folder for main MEAN ${this.name}`);
      this.ws.use(express.static("./dist/public"));
      const dist_dir = path.resolve(__dirname + "/../../../dist");
      this.ws.use("/*", (req, res) => {
        res.sendFile("/public/dv-dev/index.html", {root: dist_dir});
      });
    }

    this.ws.listen(this._opts.port, () => {
      console.log(`Listening with opts ${JSON.stringify(this._opts, null, 2)}`);
    });
  }

  serve_schema(graphql_schema) {
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
    this.ws.options("/graphql", this.cors);
    this.ws.get("/graphql", this.cors, gql);
    this.ws.post("/graphql", this.cors, gql);
  }

  private cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
  }
}
