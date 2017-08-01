import {Atom} from "client-bus";

export interface Marker {
  lat: number;
  lng: number;
  title: string;
  obj: any; // representation in the maps api
}

export interface MarkerAtom extends Marker, Atom {}

export interface Map {
  obj: any;
}

export interface MapAtom extends Map, Atom {}
