import {Atom} from "client-bus";

export interface Score {
  name: string;
  score: number;
}

export interface ScoreAtom extends Score, Atom {}

export interface Target {
  name: string;
  scores: ScoreAtom[];
}

export interface TargetAtom extends Target, Atom {}
