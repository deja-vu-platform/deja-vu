export interface Schedule {
  id?: string;
  availability?: Slot[];
}

export interface Slot {
  id?: string;
  startDate: string;
  endDate: string;
}
