const graphql = require("graphql");
import { Promise } from "es6-promise";

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  task: {
    create: Helpers.resolve_create(mean.db, "task"),
    update: Helpers.resolve_update(mean.db, "task")
  },
  assignee: {
    create: Helpers.resolve_create(mean.db, "assignee"),
    update: Helpers.resolve_update(mean.db, "assignee")
  },
  assigner: {
    create: Helpers.resolve_create(mean.db, "assigner"),
    update: Helpers.resolve_update(mean.db, "assigner")
  },
};

const bus = new ServerBus(
  mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


/////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Task",
    fields: {
      atom_id: { "type": graphql.GraphQLString },
      name: { "type": graphql.GraphQLString },
      assigner: { "type": "Assigner" },
      assignee: { "type": "Assignee" },
      expiration_date: { "type": graphql.GraphQLString },
      completed: { "type": graphql.GraphQLBoolean },
      approved: { "type": graphql.GraphQLBoolean },
      updateTask: {
        "type": graphql.GraphQLBoolean,
        args: {
          name: {"type" : graphql.GraphQLString},
          assigner_id: {"type": graphql.GraphQLString},
          expiration_date: {"type": graphql.GraphQLString}
          // more fields that can be updated can be added next time
        },
        resolve: (task, {name, assigner_id, expiration_date}) => {
          const updatedTask = {};
          if (name) {
            updatedTask["name"] = name;
          }
          if (assigner_id) {
            updatedTask["assigner"] = {atom_id: assigner_id}
          }
          if (expiration_date) {
            updatedTask["expiration_date"] = expiration_date;
          }
          // if completed and/or approved fields are null,
          // initialize them to false
          if (!task.completed) {
            updatedTask["completed"] = false;
          }
          if (!task.approved) {
            updatedTask["approved"] = false;
          }
          const setOp = {$set: updatedTask};
          return mean.db.collection("tasks")
            .updateOne({atom_id: task.atom_id}, setOp)
            .then(write_res => {
              if (write_res.modifiedCount !== 1) {
                throw new Error("Couldn't update task");
              }
              return bus.update_atom("Task", task.atom_id, setOp);
            }).then(_ => true);
        }
      }
    }
  })
  .add_type({
    name: "Assigner",
    fields: {
      atom_id: { "type": graphql.GraphQLString },
      name: { "type": graphql.GraphQLString },
    }
  })
  .add_type({
    name: "Assignee",
    fields: {
      atom_id: { "type": graphql.GraphQLString },
      name: { "type": graphql.GraphQLString },
    }
  })
  .add_mutation({
    name: "createTask",
    "type": "Task",
    args: {
      name: { "type": graphql.GraphQLString },
      assigner_id: { "type": graphql.GraphQLString },
      assignee_id: { "type": graphql.GraphQLString },
      expires_on: { "type": graphql.GraphQLString }
    },
    resolve: (_, { name, assigner_id, assignee_id, expires_on }) => {
      const expiration_date = new Date(expires_on);
      const task = {
        atom_id: uuid.v4(),
        name: name,
        assigner: { atom_id: assigner_id },
        assignee: { atom_id: assignee_id },
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
  .add_mutation({
    name: "completeTask",
    "type": graphql.GraphQLBoolean,
    args: {
      task_id: { "type": graphql.GraphQLString }
    },
    resolve: (_, { task_id }) => {
      const update_op = { $set: { completed: true } };
      return mean.db.collection("tasks")
        .updateOne({ atom_id: task_id }, update_op)
        .then(_ => bus.update_atom("Task", task_id, update_op))
        .then(_ => true);
    }
  })
  .add_mutation({
    name: "claimTask",
    "type": graphql.GraphQLBoolean,
    args: {
      task_id: { "type": graphql.GraphQLString },
      assignee_id: { "type": graphql.GraphQLString }
    },
    resolve: (_, { task_id, assignee_id }) => {
      const update_op = { $set: { "assignee.atom_id": assignee_id } };
      return mean.db.collection("tasks")
        .updateOne({ atom_id: task_id }, update_op)
        .then(_ => bus.update_atom("Task", task_id, update_op))
        .then(_ => true);
    }
  })
  .add_mutation({
    name: "approveTask",
    "type": graphql.GraphQLBoolean,
    args: {
      task_id: { "type": graphql.GraphQLString }
    },
    resolve: (_, { task_id }) => {
      const update_op = { $set: { approved: true } };
      return mean.db.collection("tasks")
        .updateOne({ atom_id: task_id }, update_op)
        .then(_ => bus.update_atom("Task", task_id, update_op))
        .then(_ => true);
    }
  }).add_mutation({
    name: "createTaskForAllAssignees",
    type: "[Task]",
    args: {
      name: { "type": graphql.GraphQLString },
      assigner_id: { "type": graphql.GraphQLString },
      expires_on: { "type": graphql.GraphQLString }
    },
    resolve: (_, { name, assigner_id, expires_on }) => {
      return mean.db.collection("assignees").find({})
        .toArray()
        .then(assignee_all => {
          const tasks = assignee_all.map((assignee) => {
            return {
              atom_id: uuid.v4(),
              name: name,
              assigner: { atom_id: assigner_id },
              assignee: { atom_id: assignee.atom_id },
              expiration_date: expires_on,
              completed: false,
              approved: false
            };
          });
          return tasks;
        })
        .then(tasks => {
          return mean.db.collection("tasks").insert(tasks)
            .then(_ => {
              tasks.forEach(task => {
                bus.create_atom("Task", task.atom_id, task)
              });
            })
            .then(_ => tasks)
        });
    }
  }).add_query({
    name: "uncompletedTasks",
    type: "[Task]",
    args: {
      assignee_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assignee_id }) => {
      return mean.db.collection("tasks").find({
        $and:
          [{ "assignee.atom_id": assignee_id }, { completed: false }]
      })
        .toArray();
    }
  })
  .add_query({
    name: "unapprovedTasks",
    type: "[Task]",
    args: {
      assignee_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assignee_id }) => {
      return mean.db.collection("tasks").find({
        $and:
          [{ "assignee.atom_id": assignee_id }, { completed: true },
          { approved: false }]
      }).toArray();
    }
  })
  .add_query({
    name: "approvedTasks",
    type: "[Task]",
    args: {
      assignee_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assignee_id }) => {
      return mean.db.collection("tasks").find({
        $and:
          [{ "assignee.atom_id": assignee_id }, { approved: true }]
      })
        .toArray();
    }
  })
  .add_query({
    name: "assignedTasks",
    type: "[Task]",
    args: {
      assigner_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, {assigner_id}) => {
      return mean.db.collection("tasks").find({
        $and: 
          [{"assigner.atom_id": assigner_id},
          {"assignee": {$ne: null}},
          {completed: false}]
        }).toArray();
    }
  })
  .add_query({
    name: "unassignedTasks",
    type: "[Task]",
    args: {
      assigner_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {assigner_id}) => {
      return mean.db.collection("tasks").find({ $and: 
        [{"assigner.atom_id": assigner_id}, {"assignee": null},
        {completed: false}] }).toArray();
    }
  })
  .add_query({
    name: "claimableTasks",
    type: "[Task]",
    args: {
      assigner_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assigner_id }) => {
      return mean.db.collection("tasks").find({
        "assigner.atom_id": { $ne: assigner_id },
        $and: [{ "assignee.atom_id": null }, { completed: false }]
      }).toArray();
    }
  })
  .add_query({
    name: "pendingApprovalTasks",
    type: "[Task]",
    args: {
      assigner_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assigner_id }) => {
      return mean.db.collection("tasks").find({
        $and:
          [{ "assigner.atom_id": assigner_id }, { completed: true },
          { approved: false }]
      }).toArray();
    }
  })
  .add_query({
    name: "allTasks",
    type: "[Task]",
    args: {
      assignee_id: { "type": graphql.GraphQLString }
    },
    resolve: (root, { assignee_id }) => {
      return mean.db.collection("tasks")
            .find({ "assignee.atom_id": assignee_id })
            .toArray();
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("tasks").insertMany([
      {
        atom_id: "1", name: "Eat", completed: false, approved: false,
        assigner: { atom_id: "10" }, assignee: { atom_id: "11" }
      },
      {
        atom_id: "2", name: "Sleep", completed: true, approved: false,
        assigner: { atom_id: "10" }, assignee: { atom_id: "11" }
      },
      {
        atom_id: "3", name: "Work", completed: true, approved: true,
        assigner: { atom_id: "10" }, assignee: { atom_id: "11" }
      }],
      (err, res) => { if (err) throw err; });

    mean.db.collection("assigners").insertOne(
      { name: "Bob", atom_id: "10" },
      (err, res) => { if (err) throw err; });

    mean.db.collection("assignees").insertOne(
      { name: "Joe", atom_id: "11" },
      (err, res) => { if (err) throw err; });

  }

  mean.start();
});
