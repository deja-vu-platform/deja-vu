import {Atom} from "client-bus";

import {Map, Marker} from "../../_shared/data";
export interface Map extends Map {}
export interface Marker extends Marker {}

export interface MapAtom extends Map, Atom {}
export interface MarkerAtom extends Marker, Atom {}
