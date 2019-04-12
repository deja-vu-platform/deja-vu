export interface <%= classify(clicheName) %>Doc {
  id: string;
  content: string;
}

export interface Create<%= classify(clicheName) %>Input {
  id?: string;
  content: string;
}

export interface Update<%= classify(clicheName) %>Input {
  id: string;
  content: string;
}
