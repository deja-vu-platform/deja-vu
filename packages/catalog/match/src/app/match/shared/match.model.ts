export interface Match {
  id: string;
  userIds: string[];
}

export interface Attempt {
  id: string;
  sourceId: string;
  targetId: string;
}
