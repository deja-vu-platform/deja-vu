import {Atom} from "client-bus";

export interface Message {
  atom_id: string;
  content: string;
}

export interface Subscriber {
  atom_id: string;
  name: string;
  subcriptions: Publisher[];
}

export interface Publisher {
  atom_id: string;
  name: string;
  messages: Message[];
}

export interface SubscriberAtom extends Subscriber, Atom {}
export interface MessageAtom extends Message, Atom {}
export interface PublisherAtom extends Publisher, Atom {}
