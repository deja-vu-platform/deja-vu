import {Atom} from "client-bus";

export interface Source {
  follows: TargetAtom[];
}
export interface SourceAtom extends Source, Atom {}

export interface Target {
  name: string;
}
export interface TargetAtom extends Target, Atom {}
