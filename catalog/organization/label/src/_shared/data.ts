export interface Label {
  atom_id: string;
  name: string;
  items: Item[];
}

export interface Item {
  atom_id: string;
  name: string;
  labels: Label[];
}
