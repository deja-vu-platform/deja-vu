import { DatePipe } from '@angular/common';
import {
  Component, ElementRef, Input, OnChanges, OnInit
} from '@angular/core';
import { GatewayService, GatewayServiceFactory  } from 'dv-core';
import { Event, fromUnixTime } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  templateUrl: './show-event.component.html',
  providers: [ DatePipe ]
})
export class ShowEventComponent implements OnChanges, OnInit {
  // One is required
  @Input() event: Event | undefined;
  @Input() id: string | undefined;
  sameDayEvent = false;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.event && this.event.startDate && this.event.endDate) {
      this.sameDayEvent = this.isSameDayEvent(this.event);
    } else if (this.gs && this.id) {
      this.gs.get<{
        data: {event: { startDate: number, endDate: number }}}>('/graphql', {
        params: {
          query: ` query {
            event(id: "${this.id}") {
              startDate,
              endDate
            }
          }`
        }
      })
      .subscribe((obj) => {
        this.event = {
          startDate: fromUnixTime(obj.data.event.startDate),
          endDate: fromUnixTime(obj.data.event.endDate)
        };
        this.sameDayEvent = this.isSameDayEvent(this.event);
      });
    }
  }

  private isSameDayEvent(event: Event) {
    if (!(event.startDate && event.endDate)) {
      return false;
    }
    return event.startDate.isSame(event.endDate, 'day');
  }
}
