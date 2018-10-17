export interface EventDoc {
  id: string;
  startDate: Date;
  endDate: Date;
  pending?: PendingDoc;
}

export interface SeriesDoc {
  id: string;
  startsOn: Date;
  endsOn: Date;
  events: EventDoc[];
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-event' | 'update-event' | 'delete-event' |
    'delete-series-event' | 'create-series';
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
