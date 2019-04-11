export interface ChatDoc {
  id: string;
  content: string;
}

export interface CreateChatInput {
  id?: string;
  content: string;
}

export interface UpdateChatInput {
  id: string;
  content: string;
}
