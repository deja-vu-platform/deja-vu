const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

import {Member, Group} from "./_shared/data";

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

  // create a group
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

  // create a member
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

  // get all members directly or indirectly in a group
  .add_query({
    name: "membersByGroup",
    type: "[Member]",
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id}) => {
      const mset: Set<string> = new Set(); // found members
      const gset: Set<string> = new Set(); // explored groups

      const recurse = (g_id: string): Promise<void> => {
        return mean.db.collection("groups")
          .findOne({atom_id: g_id})
          .then(group => {
            group.members.forEach(m => mset.add(m.atom_id));
            const recursiveCalls: Promise<void>[] = [];
            group.subgroups.forEach(g => {
              if (!gset.has(g)) {
                gset.add(g.atom_id)
                recursiveCalls.push(recurse(g.atom_id));
              }
            });
            return Promise.all(recursiveCalls);
          });
      }

      gset.add(group_id);
      return recurse(group_id).then(() => {
        const IDs = Array.from(mset);
        return mean.db.collection("members")
          .find({atom_id: {$in: IDs}})
          .toArray();
      });
    }
  })

  // get all groups directly or indirectly in a group
  .add_query({
    name: "subgroupsByGroup",
    type: "[Group]",
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id}) => {
      const gset: Set<string> = new Set(); // explored groups
      const outputArr: Group[] = [];

      const recurse = (g_id: string): Promise<void> => {
        return mean.db.collection("groups")
          .findOne({atom_id: g_id})
          .then(group => {
            const recursiveCalls: Promise<void>[] = [];
            group.subgroups.forEach(g => {
              if (!gset.has(g)) {
                gset.add(g.atom_id)
                outputArr.push(g);
                recursiveCalls.push(recurse(g.atom_id));
              }
            });
            return Promise.all(recursiveCalls);
          });
      }

      gset.add(group_id);
      return recurse(group_id).then(() => {
        return outputArr;
      });
    }
  })

  // get all groups directly or indirectly containing a member
  .add_query({
    name: "groupsByMember",
    type: "[Group]",
    args: {
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {member_id}) => {
      const gset: Set<string> = new Set(); // explored groups
      const outputArr: Group[] = [];

      const getGroupsByMember = (m_id: string): Promise<Group[]> => {
        return mean.db.collection("groups")
          .find({members: {atom_id: m_id}})
          .toArray()
      }

      const getGroupsBySubgroup = (sg_id: string): Promise<Group[]> => {
        return mean.db.collection("groups")
          .find({subgroups: {atom_id: sg_id}})
          .toArray()
      }

      const recurseOnGroups = (groups: Group[]): Promise<void> => {
        const recursiveCalls: Promise<void>[] = [];
        groups.forEach(group => {
          if (!gset.has(group.atom_id)) {
            gset.add(group.atom_id);
            outputArr.push(group);
            const call = getGroupsBySubgroup(group.atom_id)
              .then(groups => recurseOnGroups(groups));
            recursiveCalls.push(call);
          }
        });
        return Promise.all(recursiveCalls).then(() => {});
      }

      return getGroupsByMember(member_id)
        .then(groups => recurseOnGroups(groups))
        .then(() => outputArr);
    }
  })

  // get all groups directly or indirectly containing a subgroup
  .add_query({
    name: "groupsBySubgroup",
    type: "[Group]",
    args: {
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {subgroup_id}) => {
      const gset: Set<string> = new Set(); // explored groups
      const outputArr: Group[] = [];

      const getGroupsBySubgroup = (sg_id: string): Promise<Group[]> => {
        return mean.db.collection("groups")
          .find({subgroups: {atom_id: sg_id}})
          .toArray()
      }

      const recurseOnGroups = (groups: Group[]): Promise<void> => {
        const recursiveCalls: Promise<void>[] = [];
        groups.forEach(group => {
          if (!gset.has(group.atom_id)) {
            gset.add(group.atom_id);
            outputArr.push(group);
            const call = getGroupsBySubgroup(group.atom_id)
              .then(groups => recurseOnGroups(groups));
            recursiveCalls.push(call);
          }
        });
        return Promise.all(recursiveCalls).then(() => {});
      }

      gset.add(subgroup_id);
      return getGroupsBySubgroup(subgroup_id)
        .then(groups => recurseOnGroups(groups))
        .then(() => outputArr);
    }
  })

  // update the name of a group
  .add_mutation({
    name: "renameGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    },
    resolve: (_, {group_id, name}) => {
      const queryObj = {atom_id: group_id};
      const updateObj = {$set: {name: name}};
      return Promise
        .all([
          mean.db.collection("groups").updateOne(queryObj, updateObj),
          bus.update_atom("Group", group_id, updateObj)
        ])
        .then(arr => arr[0].modifiedCount === 1 && arr[1]);
    }
  })

  // update the name of a member
  .add_mutation({
    name: "renameMember",
    type: graphql.GraphQLBoolean,
    args: {
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    },
    resolve: (_, {member_id, name}) => {
      const queryObj = {atom_id: member_id};
      const updateObj = {$set: {name: name}};
      return Promise
        .all([
          mean.db.collection("members").updateOne(queryObj, updateObj),
          bus.update_atom("Member", member_id, updateObj)
        ])
        .then(arr => arr[0].modifiedCount === 1 && arr[1]);
    }
  })

  // add a member to a group
  .add_mutation({
    name: "addMemberToGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, member_id}) => {
      const queryObj = {atom_id: group_id};
      const updateObj = {$addToSet: {members: {atom_id: member_id}}};

      return Promise
        .all([
          mean.db.collection("groups").updateOne(queryObj, updateObj),
          bus.update_atom("Group", group_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);
    }
  })

  // remove a member from a group
  .add_mutation({
    name: "removeMemberFromGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, member_id}) => {
      const queryObj = {atom_id: group_id};
      const updateObj = {$pull: {members: {atom_id: member_id}}};

      return Promise
        .all([
          mean.db.collection("groups").updateOne(queryObj, updateObj),
          bus.update_atom("Group", group_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);
    }
  })

  // add a subgroup to a group
  .add_mutation({
    name: "addSubgroupToGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, subgroup_id}) => {
      const queryObj = {atom_id: group_id};
      const updateObj = {$addToSet: {subgroups: {atom_id: subgroup_id}}};

      return Promise
        .all([
          mean.db.collection("groups").updateOne(queryObj, updateObj),
          bus.update_atom("Group", group_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);
    }
  })

  // remove a member from a group
  .add_mutation({
    name: "removeSubgroupFromGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, subgroup_id}) => {
      const queryObj = {atom_id: group_id};
      const updateObj = {$pull: {subgroups: {atom_id: subgroup_id}}};

      return Promise
        .all([
          mean.db.collection("groups").updateOne(queryObj, updateObj),
          bus.update_atom("Group", group_id, updateObj)
        ])
        .then(arr  => arr[0].modifiedCount && arr[1]);
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
