export type Name = string;

export interface Label {
  name: Name;
}

export interface Item {
  name: Name;
  labels: Label[];
}
