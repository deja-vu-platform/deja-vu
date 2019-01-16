import { Component, Input } from '@angular/core';

@Component({
  selector: 'rendezvous-show-event-summary',
  templateUrl: './show-event-summary.component.html',
  styleUrls: ['./show-event-summary.component.css']
})
export class ShowEventSummaryComponent {
  @Input() eventId: string;
  @Input() set event(event: any) {
    this.eventId = event.id;
  }
}
