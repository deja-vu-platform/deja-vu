import {
  Component, OnChanges, ElementRef, Input, OnInit
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';
import { WeeklyEvent, Event } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  template: '{{event.startDate}} - {{event.endDate}}',
})
export class ShowEventComponent implements OnChanges, OnInit {
  @Input() event: Event;
  formattedEvent: Event;

  gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
  }

  ngOnChanges() {
    if (this.event.startDate && this.event.endDate) {
      this.formattedEvent = {
        id: this.event.id,
        startDate: this.formatDateStr(this.event.startDate),
        endDate: this.formatDateStr(this.event.endDate)
      };
    } else if (this.event.id) {
      this.gs
        .get<{event: Event}>(`
          event(id: "${this.event.id}") {
            startDate,
            endDate
          }
        `)
        .subscribe(obj => {
          const startDate = obj.event.startDate;
          const endDate = obj.event.endDate;
          this.formattedEvent = {
            id: this.event.id,
            startDate: this.formatDateStr(startDate),
            endDate: this.formatDateStr(endDate)
          };
        });
    }
  }

  formatDateStr(date: string): string {
    const opts = {
      day: 'numeric', weekday: 'short', month: 'short', year: 'numeric',
      hour: 'numeric', minute: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', opts);
  }
}
