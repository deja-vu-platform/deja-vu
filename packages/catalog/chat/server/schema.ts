export interface MessageDoc {
  id: string;
  content: string;
  timestamp: number;
  authorId: string;
  chatId: string;
}

export interface CreateMessageInput {
  id?: string;
  content: string;
  authorId: string;
  chatId: string;
}

export interface ChatMessagesInput {
  chatId: string;
  maxMessageCount: number;
}

export interface NewChatMessagesInput {
  chatId: string;
  lastMessageTimestamp: number;
}
