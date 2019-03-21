export interface GroupDoc {
  id: string;
  memberIds: string[];
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-group' | 'add-member' | 'remove-member';
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
