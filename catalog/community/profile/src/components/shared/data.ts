import {Atom} from "client-bus";

export interface Profile {
  atom_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birthday?: string; // Date
}

export interface ProfileAtom extends Profile, Atom {}
