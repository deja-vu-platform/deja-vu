export interface ScheduleDoc {
  id: string;
  availability: SlotDoc[];
}

export interface SlotDoc {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface SlotsInput {
  scheduleId: string;
  startDate: string;
  endDate: string;
}

export interface NextAvailabilityInput {
  scheduleIds: string[];
}

export interface AllAvailabilityInput {
  scheduleIds: string[];
  startDate?: string;
  endDate?: string;
}

export interface CreateScheduleInput {
  id?: string;
  slots?: SlotDoc[];
}

export interface UpdateScheduleInput {
  id: string;
  add?: SlotDoc[];
  update?: SlotDoc[];
  delete?: string[];
}
