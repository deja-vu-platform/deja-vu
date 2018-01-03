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
}
