export interface Score {
  id: string;
  value: number;
}

export interface Target {
  id: string;
  scores: Score[];
  total: number;
}
