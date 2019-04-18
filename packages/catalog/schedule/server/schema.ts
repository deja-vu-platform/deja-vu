export interface ScheduleDoc {
  id: string;
  content: string;
}

export interface CreateScheduleInput {
  id?: string;
  content: string;
}

export interface UpdateScheduleInput {
  id: string;
  content: string;
}
