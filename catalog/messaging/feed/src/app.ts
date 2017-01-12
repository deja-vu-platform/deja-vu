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
      {name: "Ben", subscriptions: [
        "Software Engineering News", "Things Ben Bitdiddle Says"]},
      {name: "Alyssa", subscriptions: []}
    ], (err, res) => { if (err) throw err; });

    // Pubs
    mean.db.collection("publishers").insertMany([
      {name: "Software Engineering News", messages: [
        "Node v0.0.1 released!"]},
      {name: "Things Ben Bitdiddle Says", messages: ["Hi"]},
      {name: "U.S News", messages: []},
      {name: "World News", messages: []},
      {name: "New Books about Zombies", messages: []}
    ], (err, res) => {
      if (err) throw err;
      console.log(`Inserted ${res.insertedCount} pubs for debug`);
    });
  }

  mean.start();
});
