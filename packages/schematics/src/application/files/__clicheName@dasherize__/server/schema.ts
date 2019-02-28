export interface <%= classify(clicheName) %>Doc {
  id: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-<%= dasherize(clicheName) %>';
}

export interface Create<%= classify(clicheName) %>Input {
  id?: string;
}
