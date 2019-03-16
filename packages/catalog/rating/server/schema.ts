export interface RatingDoc {
  sourceId: string;
  targetId: string;
  rating: number;
}

export interface RatingInput {
  bySourceId: string;
  ofTargetId: string;
}

export interface RatingsInput {
  bySourceId?: string;
  ofTargetId?: string;
}

export interface SetRatingInput {
  sourceId: string;
  targetId: string;
  newRating?: number;
}
