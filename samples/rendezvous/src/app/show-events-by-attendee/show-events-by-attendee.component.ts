import { Component, Input } from '@angular/core';
import {
  ShowEventSummaryComponent
} from '../show-event-summary/show-event-summary.component';

@Component({
  selector: 'rendezvous-show-events-by-attendee',
  templateUrl: './show-events-by-attendee.component.html',
  styleUrls: ['./show-events-by-attendee.component.css']
})
export class ShowEventsByAttendeeComponent {
  @Input() user: any;
  showEventSummary = ShowEventSummaryComponent;
}
