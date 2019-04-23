export interface Schedule {
  id?: string;
  availability?: Slot[];
}

export interface Slot {
  id?: string;
  startDate: Date;
  endDate: Date;
}
