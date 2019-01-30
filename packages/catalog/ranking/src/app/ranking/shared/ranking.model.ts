export interface Ranking {
  id: string;
  sourceId?: string;
  targetId: string;
  rank: number;
}

export interface TargetRank {
  id: string;
  rank: number;
}
