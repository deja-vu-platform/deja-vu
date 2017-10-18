const graphql = require("graphql");

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

const mean = new Mean();

const handlers = {
    user: {
        create: Helpers.resolve_create(mean.db, "user")
    },
    resource: {
        read: args => {
            console.log("someone read resource of id " + args.atom_id);
            return Promise.resolve(true);
        },
        create: Helpers.resolve_create(mean.db, "resource")
    }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);

//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
    .add_type({
        name: "User",
        fields: {
            username: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
        }
    })
    .add_type({
        name: "Resource",
        fields: {
            owner: { "type": "User" },
            viewers: { "type": "[User]" }
        }
    })
    .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
