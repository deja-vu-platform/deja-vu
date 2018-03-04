import {
  Component, OnChanges, ElementRef, Input, OnInit
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { GatewayServiceFactory, GatewayService } from 'dv-core';
import { WeeklyEvent, Event } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  templateUrl: './show-event.component.html',
  providers: [ DatePipe ]
})
export class ShowEventComponent implements OnChanges, OnInit {
  @Input() event: Event;
  sameDayEvent = false;

  gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.sameDayEvent = this.isSameDayEvent(this.event);
  }

  ngOnChanges() {
    if (this.event.startDate && this.event.endDate) {
      this.sameDayEvent = this.isSameDayEvent(this.event);
    } else if (this.event.id) {
      this.gs
        .get<{event: Event}>(`
          event(id: "${this.event.id}") {
            startDate,
            endDate
          }
        `)
        .subscribe(obj => {
          this.event = obj.event;
          this.sameDayEvent = this.isSameDayEvent(obj.event);
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
