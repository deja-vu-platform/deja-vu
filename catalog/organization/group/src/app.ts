const graphql = require("graphql");

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

import * as _u from "underscore";

import { Member, Group } from "./_shared/data";

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
      atom_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      name: { "type": graphql.GraphQLString }
    }
  })
  .add_type({
    name: "Group",
    fields: {
      atom_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      name: { "type": graphql.GraphQLString },
      members: { "type": "[Member]" },
      subgroups: { "type": "[Group]" }
    }
  })

  // create a group
  .add_mutation({
    name: "createGroup",
    type: graphql.GraphQLString,
    args: {},
    resolve: (_, { }) => {
      let newGroup = {
        atom_id: uuid.v4(),
        name: "",
        members: [],
        subgroups: []
      };
      return mean.db.collection("groups")
        .insertOne(newGroup)
        .then(_ => bus.create_atom("Group", newGroup.atom_id, newGroup))
        .then(success => success ? newGroup.atom_id : "");
    }
  })

  // create a member
  .add_mutation({
    name: "createMember",
    type: graphql.GraphQLString,
    args: {
      name: { "type": graphql.GraphQLString }
    },
    resolve: (_, { name }) => {
      let newMember = {
        "atom_id": uuid.v4(),
        "name": name
      };
      return mean.db.collection("members")
        .insertOne(newMember)
        .then(_ => bus.create_atom("Member", newMember.atom_id, newMember))
        .then(success => success ? newMember.atom_id : "");
    }
  })

  // get all members directly or indirectly in a group
  .add_query({
    name: "membersByGroup",
    type: "[Member]",
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id }) => {
      const found_members: Set<string> = new Set();

      return forEachGroupInGroup(group_id, (group: Group) => {
        group.members.forEach((member: Member) => {
          found_members.add(member.atom_id);
        });
      })
        .then(() => {
          const IDs = Array.from(found_members);
          return mean.db.collection("members")
            .find({ atom_id: { $in: IDs } })
            .toArray();
        });
    }
  })

  // get all groups directly or indirectly in a group
  .add_query({
    name: "subgroupsByGroup",
    type: "[Group]",
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id }) => {
      const outputArr: Group[] = [];

      return forEachGroupInGroup(group_id, (group: Group) => {
        if (group.atom_id !== group_id) {
          outputArr.push(group);
        }
      })
        .then(() => outputArr);
    }
  })

  // get all groups directly containing a member
  .add_query({
    name: "groupsByDirectMember",
    type: "[Group]",
    args: {
      member_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { member_id }) => {
      return getGroupsByDirectMember(member_id);
    }
  })

  // get all groups directly containing a subgroup
  .add_query({
    name: "groupsByDirectSubgroup",
    type: "[Group]",
    args: {
      subgroup_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { subgroup_id }) => {
      return getGroupsByDirectSubgroup(subgroup_id);
    }
  })

  // get all groups directly or indirectly containing a member
  .add_query({
    name: "groupsByMember",
    type: "[Group]",
    args: {
      member_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { member_id }) => {
      const outputArr: Group[] = [];

      return forEachGroupContainingMember(member_id, (group: Group) => {
        outputArr.push(group);
      })
        .then(() => outputArr);
    }
  })

  // get all groups directly or indirectly containing a subgroup
  .add_query({
    name: "groupsBySubgroup",
    type: "[Group]",
    args: {
      subgroup_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { subgroup_id }) => {
      const outputArr: Group[] = [];

      return forEachGroupContainingGroup(subgroup_id, (group: Group) => {
        outputArr.push(group);
      })
        .then(() => outputArr);
    }
  })

  // update the name of a group
  .add_mutation({
    name: "renameGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      name: { "type": graphql.GraphQLString }
    },
    resolve: (_, { group_id, name }) => {
      return renameMemberOrGroup(group_id, name, "Group");
    }
  })

  // update the name of a member
  .add_mutation({
    name: "renameMember",
    type: graphql.GraphQLBoolean,
    args: {
      member_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      name: { "type": graphql.GraphQLString }
    },
    resolve: (_, { member_id, name }) => {
      return renameMemberOrGroup(member_id, name, "Member");
    }
  })

  // add a member to a group
  .add_mutation({
    name: "addMemberToGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      member_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id, member_id }) => {
      return addOrRemoveMemberOrSubgroup(
        group_id, member_id, "members", "$addToSet"
      );
    }
  })

  // remove a member from a group
  .add_mutation({
    name: "removeMemberFromGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      member_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id, member_id }) => {
      return addOrRemoveMemberOrSubgroup(
        group_id, member_id, "members", "$pull"
      );
    }
  })

  // add a subgroup to a group
  .add_mutation({
    name: "addSubgroupToGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      subgroup_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id, subgroup_id }) => {
      return addOrRemoveMemberOrSubgroup(
        group_id, subgroup_id, "subgroups", "$addToSet"
      );
    }
  })

  // remove a member from a group
  .add_mutation({
    name: "removeSubgroupFromGroup",
    type: graphql.GraphQLBoolean,
    args: {
      group_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
      subgroup_id: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
    },
    resolve: (_, { group_id, subgroup_id }) => {
      return addOrRemoveMemberOrSubgroup(
        group_id, subgroup_id, "subgroups", "$pull"
      );
    }
  })
  .schema();


// gets all groups directly containing the member with given atom_id
function getGroupsByDirectMember(member_id: string): Promise<Group[]> {
  return mean.db.collection("groups")
    .find({ members: { atom_id: member_id } })
    .toArray();
}

// gets all groups directly containing the subgroup with given atom_id
function getGroupsByDirectSubgroup(subgroup_id: string): Promise<Group[]> {
  return mean.db.collection("groups")
    .find({ subgroups: { atom_id: subgroup_id } })
    .toArray();
}

// recursively explores subgroups of a group with given atom_id
// does groupVisitFn on each subgroup
// the root parent group does get visited
function forEachGroupInGroup(
  group_id: string,
  groupVisitFn: (group: Group) => void
): Promise<void> {
  const recurse = function (
    group_id: string,
    groupVisitFn: (group: Group) => void,
    visitedGroups: Set<string> = new Set([group_id])
  ) {
    return mean.db.collection("groups")
      .findOne({ atom_id: group_id })
      .then(group => {
        groupVisitFn(group);
        const recursiveCalls: Promise<void>[] = [];
        group.subgroups.forEach(group => {
          if (!visitedGroups.has(group)) {
            visitedGroups.add(group.atom_id);
            recursiveCalls.push(
              recurse(group.atom_id, groupVisitFn, visitedGroups)
            );
          }
        });
        return Promise.all(recursiveCalls).then(() => { });
      });
  }
  return recurse(group_id, groupVisitFn, new Set([group_id]));
};

// Recursive step for forEachGroupContaining... functions
// Not intended to be used on its own
function _groupContainingRecurse(
  group_id: string,
  groupVisitFn: (group: Group) => void,
  visitedGroups: Set<string>
): Promise<void> {
  return mean.db.collection("groups")
    .find({ subgroups: { atom_id: group_id } })
    .toArray()
    .then(groups => {
      const recursiveCalls: Promise<void>[] = [];
      groups.forEach(group => {
        if (!visitedGroups.has(group.atom_id)) {
          visitedGroups.add(group.atom_id);
          groupVisitFn(group);
          recursiveCalls.push(
            _groupContainingRecurse(group.atom_id, groupVisitFn, visitedGroups)
          );
        }
      });
      return Promise.all(recursiveCalls).then(() => { });
    });
}

// recursively explores groups where the group with given atom_id is a subgroup
// does groupVisitFn on each group
// the root child subgroup is not visited
function forEachGroupContainingGroup(
  group_id: string,
  groupVisitFn: (group: Group) => void
): Promise<void> {
  return _groupContainingRecurse(group_id, groupVisitFn, new Set([group_id]));
};

// recursively explores groups where the group with given atom_id is a subgroup
// does groupVisitFn on each group
// the root child subgroup is not visited
function forEachGroupContainingMember(
  member_id: string,
  groupVisitFn: (group: Group) => void
): Promise<void> {
  const visitedGroups: Set<string> = new Set([])

  return getGroupsByDirectMember(member_id)
    .then(groups => {
      groups.forEach(group => {
        visitedGroups.add(group.atom_id);
        groupVisitFn(group);
      });
      return Promise.all(groups.map(group =>
        _groupContainingRecurse(group.atom_id, groupVisitFn, visitedGroups)
      ));
    })
    .then(_ => { });
};

// does an update to add/remove a member/subgroup from a group
// use group_field = "members" or "subgroups"
// use operation = "$addToSet" to add, "$pull" to remove
function addOrRemoveMemberOrSubgroup(
  group_id: string,
  child_id: string,
  group_field: string,
  operation: string
): Promise<boolean> {
  const queryObj = { atom_id: group_id };
  const updateObj = { [operation]: { [group_field]: { atom_id: child_id } } };

  return Promise
    .all([
      mean.db.collection("groups").updateOne(queryObj, updateObj),
      bus.update_atom("Group", group_id, updateObj)
    ])
    .then(arr => arr[0].modifiedCount && arr[1]);
}

// renames entitiy with atom_id to name
// type is type of entity, "Group" or "Member"
function renameMemberOrGroup(
  atom_id: string,
  name: string,
  type: string
): Promise<boolean> {
  const queryObj = { atom_id: atom_id };
  const updateObj = { $set: { name: name } };

  const typeCollectionMap = {
    Member: "members",
    Group: "groups"
  };
  return Promise
    .all([
      mean.db.collection(typeCollectionMap[type])
        .updateOne(queryObj, updateObj),
      bus.update_atom(type, atom_id, updateObj)
    ])
    .then(arr => arr[0].modifiedCount === 1 && arr[1]);
}


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
          members: [{ atom_id: "1" }, { atom_id: "2" }],
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
