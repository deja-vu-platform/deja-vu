import {
  Component, AfterViewInit, ElementRef, Input, OnInit, Output,
  EventEmitter
} from '@angular/core';
import {
  GatewayServiceFactory, GatewayService, RunService, OnRun
} from 'dv-core';

import * as _ from 'lodash';

import { Event } from '../../../../shared/data';


@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements OnInit, OnRun {
  @Input() id = ''; // optional
  @Input() buttonLabel = 'Create Weekly Event';
  startsOn = '';
  endsOn = '';
  startTime = '';
  endTime = '';
  @Output() events = new EventEmitter<Event[]>();

  gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(id: string): Promise<void> {
    await this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          createWeeklyEvent(input: {
            ${this.id ? `id: "${this.id}",` : ''}
            startsOn: "${this.startsOn}", endsOn: "${this.endsOn}",
            startTime: "${this.startTime}", endTime: "${this.endTime}"
          }) {
            id,
            events {
              id,
              startDate,
              endDate,
              weeklyEvent {
                id
              }
            }
          }
        }`
      }))
      .toPromise()
    .then((res: {data: any}) => {
      this.events.emit(_.map(res.data.createWeeklyEvent.events, evt => {
        evt.weeklyEventId = evt.weeklyEvent.id;
        return evt;
      }));
    });
  }
}
