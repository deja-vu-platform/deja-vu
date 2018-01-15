import {Atom} from "client-bus";

export interface Assigner {
  atom_id: string;
}

export interface AssignerAtom extends Atom {}

export interface Assignee {
  atom_id: string;
}

export interface AssigneeAtom extends Atom {}

export interface NamedAtom extends Atom { name: string; }

export interface Task extends NamedAtom {
  atom_id: string;
  assigner: Assigner;
  assignee: Assignee;
  expiration_date: string; // Datetime;
}

export interface TaskAtom extends Task, Atom {}
