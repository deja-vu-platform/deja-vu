import { Component, Input } from '@angular/core';
import {
  ShowEventInfoComponent
} from '../show-event-info/show-event-info.component';

@Component({
  selector: 'mapmit-show-events',
  templateUrl: './show-events.component.html',
  styleUrls: ['./show-events.component.css']
})
export class ShowEventsComponent {
  @Input() user: any;
  showEventInfo = ShowEventInfoComponent;
}
