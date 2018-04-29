export interface Score {
  id: string;
  value: number;
  targetId: string;
}

export interface Target {
  id: string;
  scores: Score[];
  total: number;
}
