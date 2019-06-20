export interface Rating {
  sourceId: string;
  targetId: string;
  rating: number;
}

const RATING_VALUE_ONE = 1;
const RATING_VALUE_TWO = 2;
const RATING_VALUE_THREE = 3;
const RATING_VALUE_FOUR = 4;

export const DEFAULT_RATING_FILTER = [ RATING_VALUE_ONE, RATING_VALUE_TWO,
  RATING_VALUE_THREE, RATING_VALUE_FOUR ];
