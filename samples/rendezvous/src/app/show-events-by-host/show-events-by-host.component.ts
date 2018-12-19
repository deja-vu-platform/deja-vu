import { Component, Input } from '@angular/core';
import {
  ShowEventSummaryComponent
} from '../show-event-summary/show-event-summary.component';

@Component({
  selector: 'rendezvous-show-events-by-host',
  templateUrl: './show-events-by-host.component.html',
  styleUrls: ['./show-events-by-host.component.css']
})
export class ShowEventsByHostComponent {
  @Input() user: any;
  showEventSummary = ShowEventSummaryComponent;
}
