export interface Event {
  id: string;
  startDate: number;
  endDate: number;
  series?: Series;
}

export interface Series {
  id: string;
  startsOn: number;
  endsOn: number;
  events: Event[];
}
