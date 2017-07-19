import {Atom} from "client-bus";

export interface Marker {
  lat: number;
  lng: number;
  title: string;
}

export interface MarkerAtom extends Marker, Atom {}

export interface Map {}

export interface MapAtom extends Map, Atom {}
