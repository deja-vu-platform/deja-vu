import {Atom} from "client-bus";

export interface Event {
  atom_id: string;
  start_date: string; // Datetime;
  end_date: string; // Datetime;
  weekly_event_id: string;
}
export interface EventAtom extends Event, Atom {}

export interface WeeklyEvent {
  atom_id: string;
  starts_on: string; // Date;
  ends_on: string; // Date;
  start_time: string; // Time;
  end_time: string; // Time;
}
export interface WeeklyEventAtom extends WeeklyEvent, Atom {}
