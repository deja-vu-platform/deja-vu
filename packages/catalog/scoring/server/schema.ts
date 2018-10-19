export interface ScoreDoc {
  id: string;
  value: number;
  targetId: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-score';
}

export interface Target {
  id: string;
  scores: ScoreDoc[];
  total?: number; // optional to allow lazy computation
}

export interface CreateScoreInput {
  id: string;
  value: number;
  targetId: string;
}
