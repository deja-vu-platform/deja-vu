import { Component, AfterViewInit, ElementRef, Input } from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent {
  @Input() id = ''; // optional
  startsOn = '';
  endsOn = '';
  startTime = '';
  endTime = '';
  gs: GatewayService;

  constructor(elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  onSubmit() {
    this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          createWeeklyEvent(input: {
            ${this.id ? `id: "${this.id}",` : ''}
            startsOn: "${this.startsOn}", endsOn: "${this.endsOn}",
            startTime: "${this.startTime}", endTime: "${this.endTime}"
          }) {
            id
          }
        }`
      }))
      .subscribe(() => {
        // Clear out the fields on success
        this.startsOn = '';
        this.endsOn = '';
        this.startTime = '';
        this.endTime = '';
      });
  }
}
