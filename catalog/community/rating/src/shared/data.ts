import {Atom} from "client-bus";

export interface Rating {
  target: Atom;
  source: Atom;
  rating: number;
}

export interface RatingAtom extends Rating, Atom {}
