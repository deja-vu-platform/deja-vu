const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const mean = new Mean();

const handlers = {
  publisher: {
    create: Helpers.resolve_create(mean.db, "publisher"),
    update: Helpers.resolve_update(mean.db, "publisher")
  },
  subscriber: {
    create: Helpers.resolve_create(mean.db, "subscriber"),
    update: Helpers.resolve_update(mean.db, "subscriber")
  },
  message: {
    create: Helpers.resolve_create(mean.db, "message"),
    update: Helpers.resolve_update(mean.db, "message")
  }
};

new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


/////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Message",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      content: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Publisher",
    fields: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      messages: {"type": "[Message]"}
    }
  })
  .add_type({
    name: "Subscriber",
    fields: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      subscriptions: {"type": "[Publisher]"}
    }
  })
  .add_query({
    name: "sub",
    "type": "Subscriber",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    },
    resolve: (root, {name}) => {
      console.log(`getting ${name}`);
      return mean.db.collection("subscribers").find({name: name}).limit(1).next();
    }
  })
  .schema();


Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("subscribers").insertMany([
      {atom_id: "Ben", name: "Ben", subscriptions: [
        {atom_id: 1}, {atom_id: 2}]},
      {atom_id: "Alyssa", name: "Alyssa", subscriptions: []}
    ], (err, res) => { if (err) throw err; });

    mean.db.collection("publishers").insertMany([
      {atom_id: 1, name: "Software Engineering News", messages: [
        {atom_id: "node"}]},
      {atom_id: 2, name: "Things Ben Bitdiddle Says", messages: [
        {atom_id: "hi"}]},
    ], (err, res) => { if (err) throw err; });

    mean.db.collection("messages").insertMany([
      {atom_id: "hi", name: "hi", content: "hi"},
      {atom_id: "node", name: "node", content: "Node v0.0.1 released!"}
    ], (err, res) => { if (err) throw err; });
  }

  mean.start();
});
