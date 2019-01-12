import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit
} from '@angular/core';
import {
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from 'dv-core';
import { Event, fromUnixTime } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  templateUrl: './show-event.component.html',
  providers: [ DatePipe ]
})
export class ShowEventComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // One is required
  @Input() event: Event | undefined;
  @Input() id: string | undefined;

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  sameDayEvent = false;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    if (this.event && this.event.startDate && this.event.endDate) {
      this.sameDayEvent = this.isSameDayEvent(this.event);
    } else {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{
        data: {event: { startDate: number, endDate: number }}}>('/graphql', {
        params: {
          inputs: { id: this.id },
          extraInfo: {
            returnFields: `
              startDate
              endDate
            `
          }
        }
      })
      .subscribe((obj) => {
        if (obj.data.event) {
          this.event = {
            startDate: fromUnixTime(obj.data.event.startDate),
            endDate: fromUnixTime(obj.data.event.endDate)
          };
          this.sameDayEvent = this.isSameDayEvent(this.event);
        }
      });
    }
  }

  private isSameDayEvent(event: Event) {
    if (!(event.startDate && event.endDate)) {
      return false;
    }

    return event.startDate.isSame(event.endDate, 'day');
  }

  private canEval(): boolean {
    return !!(!this.event && this.id && this.gs);
  }
}
