import { Component } from '@angular/core';
import {
  ShowEventSummaryComponent
} from '../show-event-summary/show-event-summary.component';

@Component({
  selector: 'rendezvous-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  user: any;
  showEventSummary = ShowEventSummaryComponent;
}
