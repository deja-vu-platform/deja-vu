/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import * as http from "http";
const express_graphql = require("express-graphql");
const graphql = require("graphql");


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
    _ws.options("/dv-bus", this._cors);
    _ws.get("/dv-bus", this._cors, gql);
    _ws.post("/dv-bus", this._cors, gql);
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

  private _cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
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
