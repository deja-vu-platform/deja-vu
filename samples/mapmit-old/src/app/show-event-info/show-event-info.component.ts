import { Component, Input } from '@angular/core';

@Component({
  selector: 'mapmit-show-event-info',
  templateUrl: './show-event-info.component.html',
  styleUrls: ['./show-event-info.component.css']
})
export class ShowEventInfoComponent {
  @Input() eventId: string;
  @Input() loggedInUserId: string;
  @Input() set event(event: any) {
    this.eventId = event.id;
  }
}
