export interface EventDoc {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface SeriesDoc {
  id: string;
  startsOn: Date;
  endsOn: Date;
  events: EventDoc[];
}

export interface GraphQlEvent extends EventDoc {
  series?: SeriesDoc;
}

export interface CreateEventInput {
  id: string;
  startDate: number;
  endDate: number;
}

export interface UpdateEventInput {
  id: string;
  startDate?: number;
  endDate?: number;
}

export interface CreateSeriesInput {
  id?: string;
  events: CreateEventInput[];
}
