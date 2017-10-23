import { Atom } from "client-bus";
import { Passkey } from "../../shared/data";

export interface PasskeyAtom extends Passkey, Atom { }
