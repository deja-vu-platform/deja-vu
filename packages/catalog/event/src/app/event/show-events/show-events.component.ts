import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { Event, GraphQlEvent, toEvent } from '../../../../shared/data';
import { ShowEventComponent } from '../show-event/show-event.component';

import { API_PATH } from '../event.config';

import * as _ from 'lodash';


@Component({
  selector: 'event-show-events',
  templateUrl: './show-events.component.html',
  styleUrls: ['./show-events.component.css']
})
export class ShowEventsComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // TODO
  @Input() startDateFilter: any;
  @Input() endDateFilter: any;

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  @Input() showEvent: ComponentValue = {
    type: <Type<Component>> ShowEventComponent
  };
  @Input() noEventsToShowText = 'No events to show';
  events: Event[] = [];

  @Output() fetchedEvents = new EventEmitter<Event[]>();

  showEvents;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showEvents = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .get<{ data: { events: GraphQlEvent[] } }>(this.apiPath, {
          params: {
            inputs: JSON.stringify({
              input: {
                startDate: this.startDateFilter,
                endDate: this.endDateFilter
              }
            }),
            extraInfo: {
              returnFields: `
                id
                startDate
                endDate
              `
            }
          }
        });
        this.events = _.map(res.data.events, (event) => toEvent(event));
        this.fetchedEvents.emit(this.events);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
