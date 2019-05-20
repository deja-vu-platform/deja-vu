import { CalendarEvent } from 'calendar-utils';
import { format } from 'date-fns';
import { Slot } from './schedule.model';

import * as _ from 'lodash';

export function timeRange(start: Date, end: Date): string {
  return `${format(start, 'h[:]mm A')} - ${format(end, 'h[:]mm A')}`;
}

export function dateTimeRange(start: Date, end: Date): string {
  const formatString = 'dddd do MM Mh[:]mm A';

  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function createNewCalendarEvent(
  start: Date, end: Date, editable: boolean): CalendarEvent {
  return {
    start: start,
    end: end,
    title: timeRange(start, end),
    cssClass: 'custom-event',
    color: {
      primary: '#488aff',
      secondary: '#bbd0f5'
    },
    resizable: {
      beforeStart: editable,
      afterEnd: editable
    },
    draggable: editable
  };
}

export function slotToCalendarEvent(slot: Slot,
  editable: boolean): CalendarEvent {
  const start = new Date(slot.startDate);
  const end = new Date(slot.endDate);

  return {
    id: slot.id,
    start: start,
    end: end,
    title: timeRange(start, end),
    cssClass: 'custom-event',
    color: {
      primary: '#488aff',
      secondary: '#bbd0f5'
    },
    resizable: {
      beforeStart: editable,
      afterEnd: editable
    },
    draggable: editable
  };
}

export function slotsToCalendarEvents(slots: Slot[],
  editable: boolean): CalendarEvent[] {
  return _.map(slots, (slot) => slotToCalendarEvent(slot, editable));
}

export function calendarEventToSlot(event: CalendarEvent): Slot {
  return {
    startDate: event.start.toISOString(),
    endDate: event.end.toISOString()
  };
}

export function calendarEventsToSlots(events: CalendarEvent[]): Slot[] {
  return _.map(events, calendarEventToSlot);
}
