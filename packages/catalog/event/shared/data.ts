import * as moment from 'moment';

export interface Event {
  id?: string;
  startDate: moment.Moment;
  endDate: moment.Moment;
  seriesId?: string;
}

export interface Series {
  id?: string;
  startsOn: moment.Moment;
  endsOn: moment.Moment;
  events: Event[];
}

export function toUnixTime(date: moment.Moment, time: string): number {
  const [hh, mm] = time.split(':');
  const ret = date.clone();
  ret.add(hh, 'h').add(mm, 'm');
  return ret.unix();
}

export function fromUnixTime(unixTime: string | number): moment.Moment {
  return moment.unix(Number(unixTime));
}
