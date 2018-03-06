import {Atom} from "client-bus";

export interface User {
  username: string;
}

export interface UserAtom extends User, Atom {}

export interface Message {
  author: UserAtom;
  content: string;
  timestamp: string; // datetime
}

export interface MessageAtom extends Message, Atom {}

export interface Chat {
  users: UserAtom[];
  messages: MessageAtom[];
}

export interface ChatAtom extends Chat, Atom {}
