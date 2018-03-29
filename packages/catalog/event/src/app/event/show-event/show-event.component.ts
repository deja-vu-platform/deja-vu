import { DatePipe } from '@angular/common';
import {
  Component, ElementRef, Input, OnChanges, OnInit
} from '@angular/core';
import { GatewayService, GatewayServiceFactory  } from 'dv-core';
import { Event, WeeklyEvent } from '../../../../shared/data';


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
      this.gs.get<{data: {event: Event}}>('/graphql', {
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
        this.event = obj.data.event;
        this.sameDayEvent = this.isSameDayEvent(this.event);
      });
    }
  }

  private isSameDayEvent(event: Event) {
    if (!(event.startDate && event.endDate)) {
      return false;
    }
    const startDateObj = new Date(event.startDate);
    const endDateObj = new Date(event.endDate);

    return startDateObj.getFullYear() === endDateObj.getFullYear() &&
      startDateObj.getMonth() === endDateObj.getMonth() &&
      startDateObj.getDate() === endDateObj.getDate();
  }
}
