import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { Event, fromUnixTime } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  templateUrl: './show-event.component.html',
  providers: [ DatePipe ]
})
export class ShowEventComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  @Input() waitOn: string[];
  // One is required
  @Input() event: Event | undefined;
  @Input() id: string | undefined;

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  @Output() loadedEvent = new EventEmitter<Event>();

  sameDayEvent = false;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.event && this.event.startDate && this.event.endDate) {
      this.sameDayEvent = this.isSameDayEvent(this.event);
    } else if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .waitAndGet<{data: {event: { startDate: number, endDate: number }}}>(
          '/graphql', () => ({
            params: {
              inputs: { id: this.id },
              extraInfo: {
                returnFields: `
                  startDate
                  endDate
                `
              }
            }
          }));
      if (res.data.event) {
        this.event = {
          startDate: fromUnixTime(res.data.event.startDate),
          endDate: fromUnixTime(res.data.event.endDate)
        };
        this.loadedEvent.emit(this.event);
        this.sameDayEvent = this.isSameDayEvent(this.event);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private isSameDayEvent(event: Event) {
    if (!(event.startDate && event.endDate)) {
      return false;
    }

    return event.startDate.isSame(event.endDate, 'day');
  }

  private canEval(): boolean {
    return !!(!this.event && this.id && this.dvs);
  }
}
