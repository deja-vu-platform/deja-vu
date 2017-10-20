import { Atom } from "client-bus";
import { User } from "../../shared/data";

export interface UserAtom extends User, Atom { }
