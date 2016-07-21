/// <reference path="../typings/tsd.d.ts" />
const express_graphql = require("express-graphql");

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

    return args => {
      const atom_id = args.atom_id;
      const create = args.create;
      let atom_obj = JSON.parse(create);
      console.log(
        "got new " + item_name + "(id " + atom_id + ") from bus " + create);
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

    return args => {
      const atom_id = args.atom_id;
      const update = args.update;
      let update_obj = JSON.parse(update);
      console.log(
        "got update " + item_name + "(id " + atom_id + ") from bus " + update);

      return db.collection(col_name)
        .updateOne({atom_id: atom_id}, update_obj)
        .then(res => res.matchedCount === 1 && res.modifiedCount === 1);
    };
  }
}
