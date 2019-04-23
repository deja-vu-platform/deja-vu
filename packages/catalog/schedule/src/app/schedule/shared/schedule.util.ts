import { CalendarEvent } from 'calendar-utils';
import { format } from 'date-fns';
import { Slot } from './schedule.model';

import * as _ from 'lodash';

export function timeRange(start: Date, end: Date): string {
  return `${format(start, 'h[:]mm A')} - ${format(end, 'h[:]mm A')}`;
}

export function slotToCalendarEvent(slot: Slot,
  editable: boolean): CalendarEvent {
  return {
    start: slot.startDate,
    end: slot.endDate,
    title: timeRange(slot.startDate, slot.endDate),
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
    startDate: event.start,
    endDate: event.end
  };
}

export function calendarEventsToSlots(events: CalendarEvent[]): Slot[] {
  return _.map(events, calendarEventToSlot);
}
