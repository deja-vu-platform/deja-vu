export interface Follower {
  atom_id: string;
  name: string;
  follows: Publisher[];
}

export interface Publisher {
  atom_id: string;
  name: string;
}

export interface Message {
  atom_id: string;
  author: Publisher;
  content: string;
}
