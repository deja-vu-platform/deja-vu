import * as moment from 'moment';

import * as _ from 'lodash';


export interface Event {
  id?: string;
  startDate: moment.Moment;
  endDate: moment.Moment;
  seriesId?: string;
}

export interface GraphQlEvent {
  id?: string;
  startDate: number;
  endDate: number;
  series?: Series;
}

export function toEvent(graphQlEvent: GraphQlEvent): Event {
  return {
    id: graphQlEvent.id,
    startDate: fromUnixTime(graphQlEvent.startDate),
    endDate: fromUnixTime(graphQlEvent.endDate),
    seriesId: graphQlEvent.series ? graphQlEvent.series.id : undefined
  };
}


export interface Series {
  id?: string;
  startsOn: moment.Moment;
  endsOn: moment.Moment;
  events: Event[];
}

export interface GraphQlSeries {
  id?: string;
  startsOn: number;
  endsOn: number;
  events: GraphQlEvent[];
}

export function toSeries(graphQlSeries: GraphQlSeries): Series {
  return {
    id: graphQlSeries.id,
    startsOn: fromUnixTime(graphQlSeries.startsOn),
    endsOn: fromUnixTime(graphQlSeries.endsOn),
    events: _.map(graphQlSeries.events, toEvent)
  };
}

export function toUnixTime(date: moment.Moment, time: string): number {
  const [hh, mm] = time.split(':');
  const ret = date.clone();
  ret.add(hh, 'h')
    .add(mm, 'm');

  return ret.unix();
}

export function fromUnixTime(unixTime: string | number): moment.Moment {
  return moment.unix(Number(unixTime));
}
