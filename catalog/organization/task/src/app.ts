const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  task: {
    create: Helpers.resolve_create(mean.db, "task"),
    update: Helpers.resolve_update(mean.db, "task")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


/////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Task",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
      assigner: {"type": "Assigner"} ,
      assignee: {"type": "Assignee"},
      expiration_date: {"type": graphql.GraphQLString},
      completed: {"type": graphql.GraphQLBoolean},
      approved: {"type": graphql.GraphQLBoolean},
    }
  })
  .add_type({
    name: "Assigner",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
    }
  })
  .add_type({
    name: "Assignee",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
    }
  })
 .add_mutation({
    name: "CreateTask",
    "type": "Task",
    args: {
      name: {"type": graphql.GraphQLString},
      assigner_id: {"type": graphql.GraphQLString} ,
      assignee_id: {"type": graphql.GraphQLString},
      expires_on: {"type": graphql.GraphQLString}
    },
    resolve: (_, {name, assigner_id, assignee_id, expires_on}) => {
      const expiration_date = new Date(expires_on);
      const task = {
        atom_id: uuid.v4(),
        name: name,
        assigner: {atom_id: assigner_id},
        assignee: {atom_id: assignee_id},
        expiration_date: expiration_date,
        completed: false,
        approved: false
      };
      return Promise
        .all([
          mean.db.collection("tasks").insertOne(task),
          bus.create_atom("Task", task.atom_id, task)
          ])
        .then(_ => task)
      } 
  })
  .add_query({
    name: "tasks",
    type: "[Task]",
    args: {
      assignee_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {assignee_id}) => {
      return mean.db.collection("tasks").find({"assignee.atom_id": assignee_id}).toArray();
    }
  })
  .schema();


Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("tasks").insertMany([
      {atom_id: "1", name: "Finish homework", completed: false,
      assigner: {atom_id: "3"}, assignee: {atom_id: "4"}},
      {atom_id: "2", name: "Do laundry", completed: true,
      assigner: {atom_id: "3"}, assignee: {atom_id: "4"}}],
      (err, res) => { if (err) throw err; });

    mean.db.collection("assigners").insertOne(
      {name: "Bob", atom_id: "3"},
      (err, res) => { if (err) throw err; });

    mean.db.collection("assignees").insertMany([
      {name: "Joe", atom_id: "4"},
      {name: "Mark", atom_id: "5"}],
      (err, res) => { if (err) throw err; });

  }

  mean.start();
});