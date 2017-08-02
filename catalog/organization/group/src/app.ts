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
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Group",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString},
      members: {"type": "[Member]"}
    }
  })
  .add_mutation({
    name: "newGroup",
    type: "Group",
    args: {
      name: {"type": graphql.GraphQLString}
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
        .then(_ => newObject);
    }
  })
  .add_mutation({
    name: "renameGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    },
    resolve: (_, {group_id, name}) => {
      const updateObj = {$set: {name: name}};
      return mean.db.collection("groups")
        .update({atom_id: group_id}, updateObj)
        .then(wRes => !!wRes.nModified);
    }
  })
  .add_mutation({
    name: "addExistingMember",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, member_id}) => {
      return Validation.memberExists(member_id).then(_ => {
        return Promise
          .all([
            mean.db.collection("groups")
              .updateOne(
                {atom_id: group_id},
                {$addToSet: {members: {atom_id: member_id}}}
              ),
            bus.update_atom("Group", group_id,
              {$addToSet: {members: {atom_id: member_id}}})
          ])
          .then(arr  => arr[0].modifiedCount && arr[1]);
      });
    }
  })
  .add_mutation({
    name: "removeMember",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, member_id}) => {
      return Promise
        .all([
          mean.db.collection("groups")
            .updateOne(
              {atom_id: group_id},
              {$pull: {members: {atom_id: member_id}}}
            ),
          bus.update_atom("Group", group_id,
            {$pull: {members: {atom_id: member_id}}})
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);
    }
  })
  .add_query({
    name: "groupsByMember",
    type: "[Group]",
    args: {
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {member_id}) => {
      return mean.db.collection("groups")
        .find({
          members: {
            $in: [{
              atom_id: member_id
            }]
          }
        })
        .toArray();
    }
  })
  .add_query({
    name: "nonMembers",
    type: "[Member]",
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id}) => {
      return mean.db.collection("groups")
        .findOne({atom_id: group_id})
        .then(group => {
          const ids = group.members ? group.members.map(m => m.atom_id) : [];
          return mean.db.collection("members")
            .find({atom_id: {$nin: ids}})
            .toArray();
        })
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

namespace Validation {
  export function memberExists(atom_id) {
    return mean.db.collection("members")
      .findOne({atom_id: atom_id})
      .then(member => {
        if (!member) throw new Error(`Member with ID ${member} not found.`);
        return member;
      });
  }
}

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
