export interface ScheduleDoc {
  id: string;
  availability: SlotDoc[];
}

export interface SlotDoc {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface AddSlotInput {
  startDate: string;
  endDate: string;
}

export interface SlotsInput {
  scheduleId: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  sortByStartDate: number;
  sortByEndDate: number;
}

export interface NextAvailabilityInput {
  scheduleIds: string[];
}

export interface AllAvailabilityInput {
  scheduleIds: string[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  sortByStartDate: number;
  sortByEndDate: number;
}

export interface CreateScheduleInput {
  id?: string;
  slots?: AddSlotInput[];
}

export interface UpdateScheduleInput {
  id: string;
  add?: AddSlotInput[];
  delete?: string[];
}
