export interface GroupDoc {
  id: string;
  memberIds: string[];
}

export interface GroupsInput {
  withMemberId: string;
}

export interface MembersInput {
  inGroupId: string;
}

export interface CreateGroupInput {
  id: string | undefined;
  initialMemberIds: string[] | undefined;
}

export interface VerifyIsMemberInput {
  groupId: string;
  memberId: string;
}
