import {Injectable} from "@angular/core";

import {GraphQlService} from "gql";

import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";

import {Member, Group} from "./data";
import {getOrDefault} from "./utils";


@Injectable()
export default class GroupService {
  constructor(private _graphQlService: GraphQlService) {}

  // creates a group, result is its atom_id
  createGroup(): Promise<string> {
    return this._graphQlService
      .post(`
        createGroup
      `)
      .map(data => getOrDefault(data, ["createGroup"], ""))
      .map(atom_id => {
        return atom_id;
      })
      .toPromise();
  }

  // creates a member, result is its atom_id
  createMember(): Promise<string> {
    return this._graphQlService
      .post(`
        createMember
      `)
      .map(data => getOrDefault(data, ["createMember"], ""))
      .toPromise();
  }

  // gets all members in the database
  getMembers(): Promise<Member[]> {
    return this._graphQlService
      .get(`
        member_all {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["member_all"], []))
      .toPromise();
  }

  // gets all groups in the database
  getGroups(): Promise<Group[]> {
    return this._graphQlService
      .get(`
        group_all {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["group_all"], []))
      .toPromise();
  }

  // gets the name of a group
  getNameOfGroup(group_id: string): Promise<string> {
    return this._graphQlService
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

  // gets the name of a member
  getNameOfMember(member_id: string): Promise<string> {
    return this._graphQlService
      .get(`
        member_by_id(
          atom_id: "${member_id}""
        ) {
          name
        }
      `)
      .map(data => getOrDefault(data, ["member_by_id", "name"], ""))
      .toPromise();
  }

  // gets all members directly in a group
  getMembersOfGroup(group_id: string): Promise<Member[]> {
    return this._graphQlService
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
      .map(data => getOrDefault(data, ["group_by_id", "members"], []))
      .toPromise();
  }

  // gets all groups which are a direct subgroup of the given group
  getSubgroupsOfGroup(group_id: string): Promise<Member[]> {
    return this._graphQlService
      .get(`
        group_by_id(
          atom_id: "${group_id}"
        ) {
          subgroups {
            atom_id,
            name
          }
        }
      `)
      .map(data => getOrDefault(data, ["group_by_id", "subgroups"], []))
      .toPromise();
  }

  // gets all groups directly or indreictly contained within a group
  getSubgroupsByGroup(group_id: string): Promise<Group[]> {
    return this._graphQlService
      .get(`
        subgroupsByGroup(
          group_id: "${group_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["subgroupsByGroup"], []))
      .toPromise();
  }

  // gets all members directly or indirectly in a group
  getMembersByGroup(group_id: string): Promise<Member[]> {
    return this._graphQlService
      .get(`
        membersByGroup(
          group_id: "${group_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["membersByGroup"], []))
      .toPromise();
  }

  // gets all groups directly or indrectly containing the member
  getGroupsByMember(member_id: string): Promise<Group[]> {
    return this._graphQlService
      .get(`
        groupsByMember(
          member_id: "${member_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["groupsByMember"], []))
      .toPromise();
  }

  // gets all groups directly or indrectly containing the subgroup
  getGroupsBySubgroup(subgroup_id: string): Promise<Group[]> {
    return this._graphQlService
      .get(`
        groupsBySubgroup(
          subgroup_id: "${subgroup_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["groupsBySubgroup"], []))
      .toPromise();
  }

  // updates the name of a group
  updateNameOfGroup(group_id: string, name: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        renameGroup(
          group_id: "${group_id}",
          name: "${name}"
        )
      `)
      .map(data => getOrDefault(data, ["renameGroup"], false))
      .toPromise();
  }

  // updates the name of a member
  updateNameOfMember(member_id: string, name: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        renameMember(
          member_id: "${member_id}",
          name: "${name}"
        )
      `)
      .map(data => getOrDefault(data, ["renameMember"], false))
      .toPromise();
  }

  // adds a member to a group
  addMemberToGroup(group_id: string, member_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        addMemberToGroup(
          group_id: "${group_id}",
          member_id: "${member_id}"
        )
      `)
      .map(data => getOrDefault(data, ["addMemberToGroup"], false))
      .toPromise();
  }

  // removes a member from a group
  removeMemberFromGroup(group_id: string, member_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        removeMemberFromGroup(
          group_id: "${group_id}",
          member_id: "${member_id}"
        )
      `)
      .map(data => getOrDefault(data, ["removeMemberFromGroup"], false))
      .toPromise();
  }

  // adds a subgroup to a group
  addSubgroupToGroup(group_id: string, subgroup_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        addSubgroupToGroup(
          group_id: "${group_id}",
          subgroup_id: "${subgroup_id}"
        )
      `)
      .map(data => getOrDefault(data, ["addSubgroupToGroup"], false))
      .toPromise();
  }

  // removes a subgroup from a group
  removeSubgroupFromGroup(
    group_id: string,
    subgroup_id: string
  ): Promise<boolean> {
    return this._graphQlService
      .post(`
        removeSubgroupFromGroup(
          group_id: "${group_id}",
          subgroup_id: "${subgroup_id}"
        )
      `)
      .map(data => getOrDefault(data, ["removeSubgroupFromGroup"], false))
      .toPromise();
  }
}
