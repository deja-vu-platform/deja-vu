import { Injectable } from "@angular/core";

import { GraphQlService } from "gql";

import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";

import { Named } from "./data";
import { getOrDefault } from "./utils";


@Injectable()
export default class GroupService {
  constructor(private _graphQlService: GraphQlService) {}

  // gets all members in the database
  getMembers(): Promise<Named[]> {
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

  // gets all subgroups in the database
  getSubgroups(): Promise<Named[]> {
    return this._graphQlService
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
  getGroups(): Promise<Named[]> {
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

  // gets the name of a group, subgroup, or member
  getName(named_id: string): Promise<string> {
    return this._graphQlService
      .get(`
        getName(
          named_id: ${named_id}
        )
      `)
      .map(data => getOrDefault(data, ["getName"], ""))
      .toPromise();
  }

  // gets all members directly or indirectly in a group or subgroup
  getMembersByParent(parent_id: string): Promise<Named[]> {
    return this._graphQlService
      .get(`
        membersByParent(
          parent_id: "${parent_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["membersByParent"], []))
      .toPromise();
  }

  // gets all members not directly or indirectly in a group or subgroup
  getNonMembersByParent(parent_id: string): Promise<Named[]> {
    return this._graphQlService
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

  // gets all subgroups not directly or indirectly in a group or subgroup
  getNonSubgroupsByParent(parent_id: string): Promise<Named[]> {
    return this._graphQlService
      .get(`
        nonSubgroupsByParent(
          parent_id: "${parent_id}"
        ) {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["nonSubgroupsByParent"], []))
      .toPromise();
  }

  // gets all groups containing the given subgroup or member
  getGroupsByChild(child_id: string): Promise<Named[]> {
    return this._graphQlService
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

  // creates a subgroup, result is its atom_id
  createSubgroup(): Promise<string> {
    return this._graphQlService
      .post(`
        createSubgroup
      `)
      .map(data => getOrDefault(data, ["createSubgroup"], ""))
      .toPromise();
  }

  // creates a member, result is its atom_id
  createMember(): Promise<string> {
    return this._graphQlService
      .post(`
        createMember()
      `)
      .map(data => getOrDefault(data, ["createMember"], ""))
      .toPromise();
  }

  // updates the name of a group, subgroup, or member
  updateName(named_id: string, name: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        rename(
          named_id: "${named_id}",
          name: ${name}
        )
      `)
      .map(data => getOrDefault(data, ["rename"], false))
      .toPromise();
  }

  // adds a member to a group or subgroup
  addMemberToParent(parent_id: string, member_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        addMemberToParent(
          parent_id: "${parent_id}",
          member_id: "${member_id}"
        )
      `)
      .map(data => getOrDefault(data, ["addMemberToParent"], false))
      .toPromise();
  }

  // adds a subgroup to a group or subgroup
  addSubgroupToParent(
    parent_id: string,
    subgroup_id: string
  ): Promise<boolean> {
    return this._graphQlService
      .post(`
        addSubgroupToParent(
          parent_id: "${parent_id}",
          subgroup_id: "${subgroup_id}"
        )
      `)
      .map(data => getOrDefault(data, ["addSubgroupToParent"], false))
      .toPromise();
  }

  // removes a member from a group or subgroup
  removeMemberFromParent(
    parent_id: string,
    member_id: string
  ): Promise<boolean> {
    return this._graphQlService
      .post(`
        removeMemberFromParent(
          parent_id: "${parent_id}",
          member_id: "${member_id}"
        )
      `)
      .map(data => getOrDefault(data, ["removeMemberFromParent"], false))
      .toPromise();
  }
}
