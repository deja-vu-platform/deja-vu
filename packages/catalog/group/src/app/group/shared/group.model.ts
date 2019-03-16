export interface Group {
  id: string;
  memberIds: string[];
}

export interface Member {
  id: string;
  groupIds: string[];
}
