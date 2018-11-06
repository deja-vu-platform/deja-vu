import { Component, OnInit, Input } from '@angular/core';
import {
  ShowEventInfoComponent
} from '../show-event-info/show-event-info.component';

@Component({
  selector: 'mapmit-show-events-info',
  templateUrl: './show-events-info.component.html',
  styleUrls: ['./show-events-info.component.css']
})
export class ShowEventsInfoComponent implements OnInit {
  @Input() user: any;
  showEventInfo = ShowEventInfoComponent;

  constructor() { }

  ngOnInit() {
  }

}
