const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  group: {
    create: Helpers.resolve_create(mean.db, "group"),
    update: Helpers.resolve_update(mean.db, "group")
  },
  member: {
    create: Helpers.resolve_create(mean.db, "member"),
    update: Helpers.resolve_update(mean.db, "member")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);

//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Member",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Group",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      name: {"type": graphql.GraphQLString},
      members: {"type": "[Member]"},
      addMember: {
        type: "Member",
        args: {
          name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (group, {name}) => {
          const member = {
            atom_id: uuid.v4(),
            name: name
          };

          return Promise
            .all([
              mean.db.collection("members").insertOne(member),
              mean.db.collection("groups")
                .updateOne(
                  {atom_id: group.atom_id},
                  {$addToSet: {members: {atom_id: member.atom_id}}}
                ),
              bus.update_atom("Group", group.atom_id,
                {$addToSet: {members: {atom_id: member.atom_id}}}),
              bus.create_atom("Member", member.atom_id, member)
            ])
            .then(_ => member)
        }
      },
      addExistingMember: {
        type: "Group",
        args: {
          atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (group, {atom_id}) => {
          return Promise
            .all([
              mean.db.collection("groups")
                .updateOne(
                  {atom_id: group.atom_id},
                  {$addToSet: {members: {atom_id: atom_id}}}
                ),
              bus.update_atom("Group", group.atom_id,
                {$addToSet: {members: {atom_id: atom_id}}})
            ])
            .then(_ =>
              mean.db.collection("groups").findOne({ atom_id: group.atom_id }));
        }
      }
    }
  })
  .add_query({
    name: "groupsByMember",
    type: "[Group]",
    args: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {atom_id}) => {
      return mean.db.collection("groups")
        .find({
          members: {
            $in: [{
              atom_id: atom_id
            }]
          }
        })
        .toArray();
    }
  })
  .add_mutation({
    name: "newGroup",
    type: "Group",
    args: {
      name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {name}) => {
      let newObject = {
        atom_id: uuid.v4(),
        name: name,
        members: []
      };

      return mean.db.collection("groups")
        .insertOne(newObject)
        .then(_ => bus.create_atom("Group", newObject.atom_id, newObject))
        .then(_ => newObject)
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    let createMembers = () => mean.db.collection("members")
      .insertMany([
        {
          atom_id: "1",
          name: "Santiago"
        },
        {
          atom_id: "2",
          name: "Daniel"
        }
      ], (err, res) => {
        if (err) throw err;
        console.log("Created members.");
        createGroups();
      });
    let createGroups = () => mean.db.collection("groups")
      .insertMany([
        {
          atom_id: "1",
          members: [{atom_id: "1"}, {atom_id: "2"}],
          name: "SDG"
        }
      ], (err, res) => {
        if (err) throw err;
        console.log("Created groups.");
      })
    createMembers();
  }
  mean.start();
});
