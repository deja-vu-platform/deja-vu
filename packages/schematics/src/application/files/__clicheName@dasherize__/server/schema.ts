export interface <%= classify(clicheName) %>Doc {
  id: string;
  content: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-<%= dasherize(clicheName) %>' | 'update-<%= dasherize(clicheName) %>' |
    'delete-<%= dasherize(clicheName) %>';
}

export interface Create<%= classify(clicheName) %>Input {
  id?: string;
  content: string;
}

export interface Update<%= classify(clicheName) %>Input {
  id: string;
  content: string;
}
