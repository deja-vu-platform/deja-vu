export interface Event {
  id: string;
  startDate: string;
  endDate: string;
  weeklyEventId?: string;
}

export interface WeeklyEvent {
  id: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
}
