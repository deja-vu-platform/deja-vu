export interface <%= classify(conceptName) %>Doc {
  id: string;
  content: string;
}

export interface Create<%= classify(conceptName) %>Input {
  id?: string;
  content: string;
}

export interface Update<%= classify(conceptName) %>Input {
  id: string;
  content: string;
}
