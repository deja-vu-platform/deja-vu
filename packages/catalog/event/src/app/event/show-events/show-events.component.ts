import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { Event, GraphQlEvent, toEvent } from '../../../../shared/data';
import { ShowEventComponent } from '../show-event/show-event.component';

import { API_PATH } from '../event.config';

import * as _ from 'lodash';


@Component({
  selector: 'event-show-events',
  templateUrl: './show-events.component.html',
  styleUrls: ['./show-events.component.css']
})
export class ShowEventsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // TODO
  @Input() startDateFilter: any;
  @Input() endDateFilter: any;

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  @Input() showEvent: Action = {
    type: <Type<Component>> ShowEventComponent
  };
  @Input() noEventsToShowText = 'No events to show';
  events: Event[] = [];

  @Output() fetchedEvents = new EventEmitter<Event[]>();

  showEvents;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showEvents = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs
        .get<{ data: { events: GraphQlEvent[] } }>(this.apiPath, {
          params: {
            query: `
              query Events($input: EventsInput!) {
                events(input: $input) {
                  id
                  startDate
                  endDate
                }
              }
            `,
            variables: {
              input: {
                startDate: this.startDateFilter,
                endDate: this.endDateFilter
              }
            }
          }
        })
        .subscribe((res) => {
          this.events = _.map(res.data.events, (event) => toEvent(event));
          this.fetchedEvents.emit(this.events);
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
