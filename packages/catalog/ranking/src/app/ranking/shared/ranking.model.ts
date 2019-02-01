export interface Ranking {
  id: string;
  sourceId?: string;
  targets: TargetRank[];
}

export interface TargetRank {
  id: string;
  rank: number;
}
