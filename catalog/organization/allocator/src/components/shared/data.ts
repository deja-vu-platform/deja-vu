import {Atom} from "client-bus";

export interface Resource {
  name: string; assigned_to: Consumer;
}
export interface ResourceAtom extends Resource, Atom {}

export interface Consumer { name: string; }
export interface ConsumerAtom extends Consumer, Atom {}
