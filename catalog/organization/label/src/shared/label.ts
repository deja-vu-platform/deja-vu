export type Name = string;

export interface Label {
  name: Name;
}

export interface Item {
  atom_id?: String;
  name: Name;
  labels: Label[];
}
