import {
  Component, AfterViewInit, ElementRef, Input, OnInit
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements OnInit {
  @Input() id = ''; // optional
  startsOn = '';
  endsOn = '';
  startTime = '';
  endTime = '';
  gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
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
