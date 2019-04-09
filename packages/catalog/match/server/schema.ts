export interface MatchDoc {
  id: string;
  content: string;
}

export interface CreateMatchInput {
  id?: string;
  content: string;
}

export interface UpdateMatchInput {
  id: string;
  content: string;
}
