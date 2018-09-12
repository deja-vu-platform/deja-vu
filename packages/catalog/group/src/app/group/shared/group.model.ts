export interface Group {
  id: string;
  memberIds: string[];
  subgroups: Group[];
}
