export interface TaskDoc {
  id: string;
  assignerId: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  approved: boolean;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-task' | 'update-task' | 'claim-task' | 'complete-task' |
    'approve-task';
}

export interface TasksInput {
  assigneeId?: string;
  assignerId?: string;
  approved?: boolean;
  assigned?: boolean;
  completed?: boolean;
}

export interface CreateTaskInput {
  id: string;
  assignerId: string;
  assigneeId: string;
  dueDate: string;
}

export interface CreateTasksForAssigneesInput {
  assignerId: string;
  assigneeIds: string[];
  dueDate: string;
}

export interface UpdateTaskInput {
  id: string;
  assignerId: string | undefined;
  assigneeId: string | undefined;
  dueDate: string | undefined;
}
