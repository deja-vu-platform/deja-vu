export interface MessageDoc {
  id: string;
  content: string;
  timestamp: Date;
  authorId: string;
  chatId: string;
}

export interface CreateMessageInput {
  id?: string;
  content: string;
  authorId: string;
  chatId: string;
}

export interface UpdateMessageInput {
  id: string;
  content: string;
  authorId: string;
}

export interface ChatMessagesInput {
  chatId: string;
  maxMessageCount: number;
}

export interface NewChatMessagesInput {
  chatId: string;
  lastMessageTimestamp: number;
}
