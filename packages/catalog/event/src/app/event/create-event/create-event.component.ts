import { Component, Input } from '@angular/core';

import { WeeklyEvent, Event } from '../../../../shared/data';


@Component({
  selector: 'event-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {
  @Input() event: Event;
  @Input() weeklyEvent: WeeklyEvent;

  run(event: Event, weeklyEvent: WeeklyEvent) {
    // todo
  }
}
