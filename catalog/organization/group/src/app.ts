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
      members: {"type": "[Member]"},
      subgroups: {"type": "[Group]"}
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
        members: [],
        subgroups: []
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
      return Validation.recordExists(member_id).then(recordType => {
        const fldToUpdate = recordType === "member" ? "members" : "subgroups";
        const setObj = {};
        setObj[fldToUpdate] = {atom_id: member_id};
        return Promise
          .all([
            mean.db.collection("groups")
              .updateOne({atom_id: group_id}, {$addToSet: setObj}),
            bus.update_atom("Group", group_id, {$addToSet: setObj})
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
      const updateObj = {$pull: {
        members: {atom_id: member_id},
        subgroups: {atom_id: member_id}
      }};
      return Promise
        .all([
          mean.db.collection("groups")
            .updateOne({atom_id: group_id}, updateObj),
          bus.update_atom("Group", group_id, updateObj)
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
      const gset = []; // unfortunately can't use Set (need id comparison)

      // function to recursively get groups (in)directly containing member
      const groupsByMember = (mID, gset) => {
        return mean.db.collection("groups")
          // find all the groups directly containgin member
          .find({$or: [
            {members: {atom_id: mID}},
            {subgroups: {atom_id: mID}}
          ]})
          .toArray()
          .then(groups => {
            // for each new group, add it to set of groups and recurse
            const promises = [];
            groups.forEach(newG => {
              if (!gset.find((oldG) => oldG.atom_id === newG.atom_id)) {
                gset.push(newG);
                promises.push(groupsByMember(newG.atom_id, gset));
              }
            });
            // wait for all async calls to return
            return Promise.all(promises).then(_ => gset);
          });
      }

      return groupsByMember(member_id, gset);

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
        // get the group's members and subgroups
        .findOne({atom_id: group_id})
          .then(group => {
            // make a list of ids already in group
            const memberIDs = group.members ? group.members.map(m => {
              return m.atom_id
            }) : [];
            const subgroupIDs = group.subgroups ? group.subgroups.map(m => {
              return m.atom_id
            }) : [];
            subgroupIDs.push(group_id);
            const includedIDs = memberIDs.concat(subgroupIDs);
            // get members and groups not in this group
            const membersPromise = mean.db.collection("members")
              .find({atom_id: {$nin: includedIDs}})
              .toArray();
            const groupsPromise = mean.db.collection("groups")
              .find({atom_id: {$nin: includedIDs}})
              .toArray();
            // return a single promise, resolving with a single array
            return Promise.all([membersPromise, groupsPromise]).then(arr => {
              // clear group-specific fields in group result
              arr[1].forEach(g => {
                g.members = undefined;
                g.subgroups = undefined;
              });
              return arr[0].concat(arr[1]);
            });
          });
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

// if member is found with id, return "member"
// else if group is found with id, return "group"
// else, throw an error
namespace Validation {
  export function recordExists(atom_id) {
    return mean.db.collection("members")
      .findOne({atom_id: atom_id})
      .then(member => {
        if (member) {
          return "member";
        } else {
           return mean.db.collection("groups")
            .findOne({atom_id: atom_id})
            .then(group => {
              if (group) {
                return "group";
              } else {
                throw new Error(`Member with ID ${member} not found.`);
              }
            });
        }
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
