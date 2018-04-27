export interface Publisher {
  id: string;
  messages?: Message[];
  followerIds?: string[];
}

export interface Message {
  id: string;
  content: string;
}
