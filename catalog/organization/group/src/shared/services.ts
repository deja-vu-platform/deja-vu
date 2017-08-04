import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";

import { Named } from "./data";
import { getOrDefault } from "./utils";


// Exported Services

// gets all members in the database
export function getMembers(gqls): Promise<Named[]> {
  return gqls
    .get(`
      member_all {
        atom_id,
        name
      }
    `)
    .map(data => getOrDefault(data, ["member_all"], []))
    .toPromise();
}

// gets all subgroups in the database
export function getSubgroups(gqls): Promise<Named[]> {
  return gqls
    .get(`
      subgroup_all {
        atom_id,
        name
      }
    `)
    .map(data => getOrDefault(data, ["subgroup_all"], []))
    .toPromise();
}

// gets all groups in the database
export function getGroups(gqls): Promise<Named[]> {
  return gqls
    .get(`
      group_all {
        atom_id,
        name
      }
    `)
    .map(data => getOrDefault(data, ["group_all"], []))
    .toPromise();
}

// gets the name of a group, subgroup, or member
export function getName(gqls, named_id: string): Promise<string> {
  return Promise
    .all([
      getGroupName(gqls, named_id),
      getSubgroupName(gqls, named_id),
      getMemberName(gqls, named_id)
    ])
    .then(arr => arr.find(name => !!name));
}

// gets all members directly or indirectly in a group or subgroup
export function getMembersByParent(
  gqls,
  parent_id: string
): Promise<Named[]> {
  return Promise
    .all([
      getMembersByGroup(gqls, parent_id),
      getMembersBySubgroup(gqls, parent_id)
    ])
    .then(arr => {
      const members = arr.find(a => a && a.length > 0); // find nonempty array
      return members ? members : []; // handle the undefined case
    });
}

// gets all members not directly or indirectly in a group or subgroup
export function getNonMembersByParent(
  gqls,
  parent_id: string
): Promise<Named[]> {
  return gqls
    .get(`
      nonMembersByParent(
        parent_id: "${parent_id}"
      ) {
        atom_id,
        name
      }
    `)
    .map(data => getOrDefault(data, ["nonMembersByParent"], []))
    .toPromise();
}

// gets all groups containing the given subgroup or member
export function getGroupsByChild(gqls, child_id: string): Promise<Named[]> {
  return gqls
    .get(`
      groupsByChild(child_id: "${child_id}") {
        atom_id,
        name
      }
    `)
    .map(data => getOrDefault(data, ["groupsByMember"], []))
    .toPromise();
}

// creates a group, result is its atom_id
export function createGroup(gqls): Promise<string> {
  return gqls
    .post(`
      createGroup
    `)
    .map(data => getOrDefault(data, ["createGroup"], ""))
    .map(atom_id => {
      console.log("got atom_id", atom_id);
      return atom_id;
    })
    .toPromise();
}

// creates a subgroup, result is its atom_id
export function createSubgroup(gqls): Promise<string> {
  return gqls
    .post(`
      createSubgroup
    `)
    .map(data => getOrDefault(data, ["createSubgroup"], ""))
    .toPromise();
}

// creates a member, result is its atom_id
export function createMember(gqls): Promise<string> {
  return gqls
    .post(`
      createMember()
    `)
    .map(data => getOrDefault(data, ["createMember"], ""))
    .toPromise();
}

// updates the name of a group, subgroup, or member
export function updateName(
  gqls,
  named_id: string,
  name: string
): Promise<boolean> {
  return gqls
    .post(`
      renameNamed(
        named_id: "${named_id}",
        name: ${name}
      )
    `)
    .map(data => getOrDefault(data, ["renameNamed"], false))
    .toPromise();
}

// adds a member to a group or subgroup
export function addMemberToParent(
  gqls,
  parent_id: string,
  member_id: string
): Promise<boolean> {
  return gqls
    .post(`
      addMemberToParent(
        parent_id: "${parent_id}",
        member_id: "${member_id}"
      )
    `)
    .map(data => getOrDefault(data, ["addMemberToParent"], false))
    .toPromise();
}

// removes a member from a group or subgroup
export function removeMemberFromParent(
  gqls,
  parent_id: string,
  member_id: string
): Promise<boolean> {
  return gqls
    .post(`
      removeMemberFromParent(
        parent_id: "${parent_id}",
        member_id: "${member_id}"
      )
    `)
    .map(data => getOrDefault(data, ["removeMemberFromParent"], false))
    .toPromise();
}

// Private Services

// gets the name of a group given its atom_id
function getGroupName(gqls, group_id): Promise<string> {
  return gqls
    .get(`
      group_by_id(
        atom_id: "${group_id}"
      ) {
        name
      }
    `)
    .map(data => getOrDefault(data, ["group_by_id", "name"], ""))
    .toPromise();
}

// gets the name of a subgroup given its atom_id
function getSubgroupName(gqls, subgroup_id): Promise<string> {
  return gqls
    .get(`
      subgroup_by_id(
        atom_id: "${subgroup_id}"
      ) {
        name
      }
    `)
    .map(data => getOrDefault(data, ["subgroup_by_id", "name"], ""))
    .toPromise();
}

// gets the name of a member given its atom_id
function getMemberName(gqls, member_id: string): Promise<string> {
  return gqls
    .get(`
      member_by_id(
        atom_id: "${member_id}"
      ) {
        name
      }
    `)
    .map(data => getOrDefault(data, ["member_by_id", "name"], ""))
    .toPromise();
}

// gets all members in a given group
function getMembersByGroup(gqls, group_id: string): Promise<Named[]> {
  return gqls
    .get(`
      group_by_id(
        atom_id: "${group_id}"
      ) {
        members {
          atom_id,
          name
        }
      }
    `)
    .map(data => getOrDefault(data, ["group_by_id, members"], []))
    .toPromise();
}

// gets all members in a given subgroup
function getMembersBySubgroup(gqls, subgroup_id: string): Promise<Named[]> {
  return gqls
    .get(`
      subgroup_by_id(
        atom_id: "${subgroup_id}"
      ) {
        members {
          atom_id,
          name
        }
      }
    `)
    .map(data => getOrDefault(data, ["subgroup_by_id, members"], []))
    .toPromise();
}
