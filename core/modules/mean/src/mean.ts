/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
import * as mongodb from "mongodb";
let command_line_args = require("command-line-args");
let express_graphql = require("express-graphql");

import {RestBus} from "rest-bus";


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


export class Mean {
  db: mongodb.Db;
  app: express.Express;
  bus: RestBus;

  constructor(public name: string, schema, init: (db, debug) => void) {
    const opts = cli.parse();

    const server = new mongodb.Server(
      opts.dbhost, opts.dbport, {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(`${name}db`, server, {w: 1});
    this.db.open((err, db) => {
      if (err) {
        console.log("Error opening mongodb");
        throw err;
      }
      init(db, opts.debugdata);
    });

    this.app = express();
    this.app.use(morgan("dev"));

    if (opts.servepublic) {
      this.app.use(express.static("./dist/public"));
    };
    const gql = express_graphql({schema: schema, pretty: true});
    this.app.options("/graphql", this._cors);
    this.app.get("/graphql", this._cors, gql);
    this.app.post("/graphql", this._cors, gql);

    this.app.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });

    this.bus = new RestBus(name, opts.bushost, opts.busport);
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
