import {Source, Target} from "../../shared/data";
import {Atom} from "client-bus";

export interface SourceAtom extends Source, Atom {}
export interface TargetAtom extends Target, Atom {}
