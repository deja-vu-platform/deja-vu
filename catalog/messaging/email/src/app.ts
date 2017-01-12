import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const mean = new Mean();


const bus = new ServerBus(
    mean.fqelement, mean.ws, {}, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

console.log("calling schema");
const schema = grafo
  .add_mutation({
    name: "sendEmail",
    "type": graphql.GraphQLBoolean,
    args: {
      to: {"type": graphql.GraphQLString},
      content: {"type": graphql.GraphQLString}
    },
    resolve: (_, {to, content}) => {
      console.log("Send email to " + to);
      console.log("content:" + content);
      return true;
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
