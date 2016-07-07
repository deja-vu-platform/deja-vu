export type Name = string;

export interface Source {
  name: Name;
  follows: Target[];
}

export interface Target {
  name: Name;
}
