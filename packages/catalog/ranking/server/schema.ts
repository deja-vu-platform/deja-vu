export interface TargetRank {
  id: string;
  rank: number;
}

// client side ranking schema
export interface Ranking {
  id: string;
  sourceId: string | undefined;
  targets: TargetRank[];
}

// saved ranking schema
export interface RankingDoc {
  id: string;
  sourceId: string | undefined;
  targetId: string;
  rank: number;
}

export interface CreateRankingInput {
  id: string | undefined;
  sourceId: string | undefined;
  targets: TargetRank[];
}

export interface RankingsInput {
  id: string | undefined;
  sourceId: string | undefined;
  targetId: string | undefined;
}
