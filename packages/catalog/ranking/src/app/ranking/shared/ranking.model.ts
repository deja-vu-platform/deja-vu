export interface Ranking {
  id: string;
  sourceId?: string;
  targetId: string;
  rank: number;
}

export interface Target {
  id: string;
  rank: number;
}
