export interface ScoreDoc {
  id: string;
  value: number;
  sourceId: string;
  targetId: string;
}

export interface Target {
  id: string;
  scores: ScoreDoc[];
  total?: number; // optional to allow lazy computation
}

export interface CreateScoreInput {
  id: string;
  value: number;
  sourceId: string;
  targetId: string;
}

export interface ShowScoreInput {
  id?: string;
  sourceId?: string;
  targetId?: string;
}
