import {Atom} from "client-bus";

import GoogleMap from "./GoogleMap";
import {Map, Marker} from "../../_shared/data";
export interface Map extends Map {}
export interface Marker extends Marker {}

export interface MapAtom extends Map, Atom {
  gmap: GoogleMap;
}

export interface MarkerAtom extends Marker, Atom {}
