export interface Follower {
  id: string;
  follows?: Publisher[];
}

export interface Publisher {
  id: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  publisher: Publisher;
  content: string;
}
