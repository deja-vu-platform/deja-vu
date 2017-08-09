export interface Member {
  atom_id: string;
  name: string;
}

export interface Group {
  atom_id: string;
  name: string;
  members: Member[];
  subgroups: Group[];
}
