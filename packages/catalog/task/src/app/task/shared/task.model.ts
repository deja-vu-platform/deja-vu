export interface Assigner {
  id: string;
}

export interface Assignee {
  id: string;
}

export interface Task {
  id: string;
  assigner: Assigner;
  assignee: Assignee;
  dueDate: string; // Datetime;
  approved: boolean;
  completed: boolean;
}
