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
      const found_members: Set<string> = new Set();

      return forEachSubgroup(group_id, (group: Group) => {
        group.members.forEach((member: Member) => {
          found_members.add(member.atom_id);
        });
      })
        .then(() => {
          const IDs = Array.from(found_members);
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
      const outputArr: Group[] = [];

      return forEachSubgroup(group_id, (group: Group) => {
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
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {member_id}) => {
      return getGroupsByDirectMember(member_id);
    }
  })

  // get all groups directly containing a subgroup
  .add_query({
    name: "groupsByDirectSubgroup",
    type: "[Group]",
    args: {
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {subgroup_id}) => {
      return getGroupsByDirectSubgroup(subgroup_id);
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
      const visited_groups: Set<string> = new Set();
      const outputArr: Group[] = [];

      return getGroupsByDirectMember(member_id)
        .then(groups => {
          groups.forEach(group => {
            visited_groups.add(group.atom_id);
            outputArr.push(group);
          });
          return groups;
        })
        .then(subgroups => Promise.all(subgroups.map(subgroup => 
            forEachContainingGroup(subgroup.atom_id, (group: Group) => {
              outputArr.push(group);
            }, visited_groups)
          ))
        )
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
      const outputArr: Group[] = [];

      return forEachContainingGroup(subgroup_id, (group: Group) => {
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
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString}
    },
    resolve: (_, {group_id, name}) => {
      return renameMemberOrGroup(group_id, name, "Group");
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
      return renameMemberOrGroup(member_id, name, "Member");
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
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      member_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, member_id}) => {
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
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, subgroup_id}) => {
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
      group_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      subgroup_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
    },
    resolve: (_, {group_id, subgroup_id}) => {
      return addOrRemoveMemberOrSubgroup(
        group_id, subgroup_id, "subgroups", "$pull"
      );
    }
  })
  .schema();


// gets all groups directly containing the member with given atom_id
const getGroupsByDirectMember = (member_id: string): Promise<Group[]> => {
  return mean.db.collection("groups")
    .find({members: {atom_id: member_id}})
    .toArray();
}

// gets all groups directly containing the subgroup with given atom_id
const getGroupsByDirectSubgroup = (subgroup_id: string): Promise<Group[]> => {
  return mean.db.collection("groups")
    .find({subgroups: {atom_id: subgroup_id}})
    .toArray();
}

// recursively explores subgroups of a group with given atom_id
// does callback on each subgroup
// populates visited_groups with the atom_id of every visited group
// the root parent group does get visited
function forEachSubgroup(
  group_id: string,
  callback: (group: Group) => void,
  visited_groups: Set<string> = new Set([group_id]),
): Promise<void> {
  return mean.db.collection("groups")
    .findOne({atom_id: group_id})
    .then(group => {
      callback(group);
      const recursiveCalls: Promise<void>[] = [];
      group.subgroups.forEach(group => {
        if (!visited_groups.has(group)) {
          visited_groups.add(group.atom_id);
          recursiveCalls.push(
            forEachSubgroup(group.atom_id, callback, visited_groups)
          );
        }
      });
      return Promise.all(recursiveCalls).then(() => {});
    });
};

// recursively explores groups where the group with given atom_id is a subgroup
// does callback on each group
// populates visited_groups with the atom_id of every visited group
// the root child subgroup is visited but not operated on
function forEachContainingGroup(
  group_id: string,
  callback: (group: Group) => void,
  visited_groups: Set<string> = new Set([group_id]),
): Promise<void> {
  return mean.db.collection("groups")
    .find({subgroups: {atom_id: group_id}})
    .toArray()
    .then(groups => {
      const recursiveCalls: Promise<void>[] = [];
      groups.forEach(group => {
        if (!visited_groups.has(group.atom_id)) {
          visited_groups.add(group.atom_id);
          callback(group);
          recursiveCalls.push(
            forEachContainingGroup(group.atom_id, callback, visited_groups)
          );
        }
      });
      return Promise.all(recursiveCalls).then(() => {});
    });
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
  const queryObj = {atom_id: group_id};
  const updateObj = {[operation]: {[group_field]: {atom_id: child_id}}};

  return Promise
    .all([
      mean.db.collection("groups").updateOne(queryObj, updateObj),
      bus.update_atom("Group", group_id, updateObj)
    ])
    .then(arr  => arr[0].modifiedCount && arr[1]);
}

// renames entitiy with atom_id to name
// type is type of entity, "Group" or "Member"
function renameMemberOrGroup(
  atom_id: string,
  name: string,
  type: string
): Promise<boolean> {
  const queryObj = {atom_id: atom_id};
  const updateObj = {$set: {name: name}};

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
