export interface Task {
  id: string;
  assignerId: string;
  assigneeId: string
  dueDate: string; // Datetime;
  approved: boolean;
  completed: boolean;
}
