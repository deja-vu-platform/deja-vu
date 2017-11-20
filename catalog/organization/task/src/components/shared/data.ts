import {Atom} from "client-bus";

export interface Task {
  atom_id: string;
  expiration_date: string; // Datetime;
}

export interface TaskAtom extends Task, Atom {}

export interface NamedAtom extends Atom { name: string; }
