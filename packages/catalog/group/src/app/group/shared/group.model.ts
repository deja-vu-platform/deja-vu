export interface Group {
  id: string;
  members: Member[];
  subgroups: Group[];
}

export interface Member {
  id: string;
}
