export interface MatchDoc {
  id: string;
  userAId: string;
  userBId: string;
  // allows for easier filtering
  userIds?: string[];
}

export interface AttemptDoc {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface AttemptsInput {
  sourceId?: string;
  targetId?: string;
}

export interface MatchesInput {
  userId: string;
}

export interface AttemptMatchInput {
  id?: string;
  sourceId: string;
  targetId: string;
}

export interface CreateMatchInput {
  id?: string;
  userAId: string;
  userBId: string;
}
