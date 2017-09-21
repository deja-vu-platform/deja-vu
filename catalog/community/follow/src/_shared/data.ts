export interface Follower {
  atom_id: string;
  name: string;
  follows: Publisher[];
}

export interface Publisher {
  atom_id: string;
  name: string;
  messages: Message[];
}

export interface Message {
  atom_id: string;
  content: string;
}
