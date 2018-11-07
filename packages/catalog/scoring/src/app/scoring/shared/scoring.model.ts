export interface Score {
  id: string;
  value: number;
  sourceId: string;
  targetId: string;
}

export interface Target {
  id: string;
  scores: Score[];
  total: number;
}
