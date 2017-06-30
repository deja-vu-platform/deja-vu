export interface Source {
  name: string;
  follows: Target[];
}

export interface Target {
  name: string;
}
