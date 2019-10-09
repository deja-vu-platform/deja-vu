import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';
import { Event, fromUnixTime } from '../../../../shared/data';


@Component({
  selector: 'event-show-event',
  templateUrl: './show-event.component.html',
  providers: [ DatePipe ]
})
export class ShowEventComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  @Input() waitOn: string[];
  // One is required
  @Input() event: Event | undefined;
  @Input() id: string | undefined;

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  @Output() loadedEvent = new EventEmitter<Event>();

  sameDayEvent = false;

  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.event && this.event.startDate && this.event.endDate) {
      this.sameDayEvent = this.isSameDayEvent(this.event);
    } else if (this.ws && this.ws.processChanges(changes)) {
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
      await this.ws.maybeWait();
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
          this.loadedEvent.emit(this.event);
          this.sameDayEvent = this.isSameDayEvent(this.event);
        }
      });
    } else if (this.gs) {
      this.gs.noRequest();
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
