import {
  CalendarDateFormatter, CalendarEventTitleFormatter, DateFormatterParams
} from 'angular-calendar';

import { DatePipe } from '@angular/common';

import { getISOWeek } from 'date-fns';

import { CalendarEvent } from 'calendar-utils';

export class CustomDateFormatterProvider extends CalendarDateFormatter {

  public dayViewHour({ date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'HH:mm', locale);
  }

  public weekViewTitle({ date, locale }: DateFormatterParams): string {
    const year: string = new DatePipe(locale).transform(date, 'y', locale);
    const weekNumber: number = getISOWeek(date);

    return `Week ${weekNumber} in ${year}`;
  }

  public weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'E', locale);
  }

  public weekViewColumnSubHeader(
    { date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'MM/dd', locale);
  }
}

export class CustomEventTitleFormatterProvider extends
  CalendarEventTitleFormatter {

  monthTooltip(event: CalendarEvent): string {
    return;
  }

  weekTooltip(event: CalendarEvent): string {
    return;
  }

  dayTooltip(event: CalendarEvent): string {
    return;
  }
}
