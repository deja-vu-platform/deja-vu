export interface Target {
  id: string;
  rank: number;
}

export interface RankingDoc {
  id: string;
  sourceId: string | undefined;
  targetId: string;
  rank: number;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-ranking';
}

export interface CreateRankingInput {
  id: string | undefined;
  sourceId: string | undefined;
  targets: Target[];
}
