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
  subgroup: {
    create: Helpers.resolve_create(mean.db, "subgroup"),
    update: Helpers.resolve_update(mean.db, "subgroup")
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
    name: "Subgroup",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString},
      members: {"type": "[Member]"},
      subgroups: {"type": "[Subgroup]"}
    }
  })
  .add_type({
    name: "Group",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString},
      members: {"type": "[Member]"},
      subgroups: {"type": "[Subgroup]"}
    }
  })

  // create handlers
  .add_mutation({
    name: "createGroup",
    type: graphql.GraphQLString,
    args: {},
    resolve: (_, {}) => {
      let newObject = {
        atom_id: uuid.v4(),
        name: "",
        members: [],
        subgroups: []
      };
      return mean.db.collection("groups")
        .insertOne(newObject)
        .then(_ => bus.create_atom("Group", newObject.atom_id, newObject))
        .then(success => success ? newObject.atom_id : "");
    }
  })
  .add_mutation({
    name: "createSubgroup",
    type: graphql.GraphQLString,
    args: {},
    resolve: (_, {}) => {
      let newObject = {
        atom_id: uuid.v4(),
        name: "",
        members: [],
        subgroups: []
      };
      return mean.db.collection("subgroups")
        .insertOne(newObject)
        .then(_ => bus.create_atom("Subgroup", newObject.atom_id, newObject))
        .then(success => success ? newObject.atom_id : "");
    }
  })
  .add_mutation({
    name: "createMember",
    type: graphql.GraphQLString,
    args: {},
    resolve: (_, {}) => {
      let newObject = {
        atom_id: uuid.v4(),
        name: ""
      };
      return mean.db.collection("members")
        .insertOne(newObject)
        .then(_ => bus.create_atom("Member", newObject.atom_id, newObject))
        .then(success => success ? newObject.atom_id : "");
    }
  })

  // get all members not directly in a group or subgroup
  .add_query({
    name: "nonMembersByParent",
    type: "[Member]",
    args: {
      parent_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {parent_id}) => {
      const byGroup = mean.db.collection("groups")
        .findOne({atom_id: parent_id})
        .then(group => {
          const memberIDs = group.members ? group.members.map(m => {
            return m.atom_id
          }) : [];
          return mean.db.collection("members")
            .find({atom_id: {$nin: memberIDs}})
            .toArray();
        });

      const bySubgroup = mean.db.collection("subgroups")
        .findOne({atom_id: parent_id})
        .then(subgroup => {
          const memberIDs = subgroup.members ? subgroup.members.map(m => {
            return m.atom_id
          }) : [];
          return mean.db.collection("members")
            .find({atom_id: {$nin: memberIDs}})
            .toArray();
        });

      return Promise.all([byGroup, bySubgroup])
        .then(arr => {
          const nonMembers = arr.find(a => !!a.length);
          return nonMembers === undefined ? [] : nonMembers;
        });
    }
  })

  // get all groups directly or indirectly containing a subgroup or member
  .add_query({
    name: "groupsByChild",
    type: "[Group]",
    args: {
      child_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {child_id}) => {
      const gset = [];
      const sgset = [];

      // finds all groups containing member or subgroup
      // adds the new ones to the array
      const groupsByChild = (mID) => {
        return mean.db.collection("groups")
          .find({$or: [
            {members: {atom_id: mID}},
            {subgroups: {atom_id: mID}}
          ]})
          .toArray()
          .then(groups => {
            groups.forEach(newG => {
              if (!gset.find((oldG) => oldG.atom_id === newG.atom_id)) {
                gset.push(newG);
              }
            });
          });
      }

      // finds all subgroups containing member or subgroup
      // recursively finds all subgroups and groups containing each new one
      const subgroupsByChild = (mID) => {
        return mean.db.collection("subgroups")
          .find({$or: [
            {members: {atom_id: mID}},
            {subgroups: {atom_id: mID}}
          ]})
          .toArray()
          .then(subgroups => {
            const promises = [];
            subgroups.forEach(newSG => {
              if (!sgset.find((oldSG) => oldSG.atom_id === newSG.atom_id)) {
                sgset.push(newSG);
                promises.push(groupsByChild(newSG.atom_id));
                promises.push(subgroupsByChild(newSG.atom_id));
              }
            });
            return Promise.all(promises);
          });
      }

      return Promise
        .all([
          groupsByChild(child_id),
          subgroupsByChild(child_id)
        ])
        .then(_ => gset);
    }
  })

  // rename a group, subgroup, or member
  .add_mutation({
    name: "renameNamed",
    type: graphql.GraphQLBoolean,
    args: {
      named_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    },
    resolve: (_, {named_id, name}) => {
      const updateObj = {$set: {name: name}};

      const rnGroup = mean.db.collection("groups")
        .updateOne({atom_id: named_id}, updateObj)

      const rnSubgroup = mean.db.collection("subgroups")
        .updateOne({atom_id: named_id}, updateObj)

      const rnMember = mean.db.collection("members")
        .updateOne({atom_id: named_id}, updateObj)

      return Promise
        .all([rnGroup, rnSubgroup, rnMember])
        .then(arr => arr.reduce((tot, wRes) => {
          return tot + wRes.modifiedCount;
        }, 0) === 1);
    }
  })

  // add a member to a group or subgroup
  .add_mutation({
    name: "addMemberToParent",
    type: graphql.GraphQLBoolean,
    args: {
      parent_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {parent_id, member_id}) => {
      const updateObj = {$addToSet: {members: {atom_id: member_id}}};

      const addToGroup = Promise
        .all([
          mean.db.collection("groups")
            .updateOne({atom_id: parent_id}, updateObj),
          bus.update_atom("Group", parent_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);

      const addToSubgroup = Promise
        .all([
          mean.db.collection("groups")
            .updateOne({atom_id: parent_id}, updateObj),
          bus.update_atom("Group", parent_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);

      return Promise.all([addToGroup, addToSubgroup])
        .then(arr => arr.reduce((numSuccesses, success) => {
          return numSuccesses + (success ? 1 : 0);
        }, 0) === 1);
    }
  })

  // add a member to a group or subgroup
  .add_mutation({
    name: "removeMemberFromParent",
    type: graphql.GraphQLBoolean,
    args: {
      parent_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {parent_id, member_id}) => {
      const updateObj = {$pull: {members: {atom_id: member_id}}};

      const removeFromGroup = Promise
        .all([
          mean.db.collection("groups")
            .updateOne({atom_id: parent_id}, updateObj),
          bus.update_atom("Group", parent_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);

      const removeFromSubgroup = Promise
        .all([
          mean.db.collection("groups")
            .updateOne({atom_id: parent_id}, updateObj),
          bus.update_atom("Group", parent_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);

      return Promise.all([removeFromGroup, removeFromSubgroup])
        .then(arr => arr.reduce((numSuccesses, success) => {
          return numSuccesses + (success ? 1 : 0);
        }, 0) === 1);
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
