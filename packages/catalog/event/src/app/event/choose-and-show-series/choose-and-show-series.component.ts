import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { Event, fromUnixTime, Series } from '../../../../shared/data';

import { ShowEventComponent } from '../show-event/show-event.component';


@Component({
  selector: 'event-choose-and-show-series',
  templateUrl: './choose-and-show-series.component.html',
  styleUrls: ['./choose-and-show-series.component.css'],
  providers: [ DatePipe ]
})
export class ChooseAndShowSeriesComponent implements OnInit {
  @Input() noEventsToShowText = 'No events to show';
  @Input() chooseSeriesSelectPlaceholder = 'Choose Weekly Event';
  selectedSeries: Series;
  series: Series[] = [];
  events: Event[] = [];

  @Input() showEvent: Action = { type: <Type<Component>> ShowEventComponent };

  chooseAndShowSeries;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.chooseAndShowSeries = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
  }

  // TODO: should instead make this reactive with Apollo
  maybeFetchEvents(toggle: boolean) {
    if (toggle) {
      this.gs
        .get<{data: {series: Series[]}}>('/graphql', {
          params: {
            query: `
              query {
                series {
                  id,
                  startsOn,
                  endsOn
                }
              }
            `
          }
        })
        .pipe(map((res) => res.data.series))
        .subscribe((series: Series[]) => {
          this.series = _.map(series, (series) => {
            series.startsOn = fromUnixTime(series.startsOn);
            series.endsOn = fromUnixTime(series.endsOn);

            return series;
          });
        });
    }
  }

  updateEvents(selectedSeries: Series) {
    this.selectedSeries = selectedSeries;
    this.events = [];
    if (!selectedSeries) {
      return;
    }
    this.gs
      .get<{data: {oneSeries: {events: Event[]}}}>('/graphql', {
        params: {
          query: `
            query {
              oneSeries(id: "${selectedSeries.id}") {
                events {
                  id,
                  startDate,
                  endDate,
                  series {
                    id
                  }
                }
              }
            }
          `
        }
      })
      .pipe(map((res) => res.data.oneSeries.events))
      .subscribe((events: Event[]) => {
        this.events = _.map(events, (evt) => {
          evt.seriesId = evt.series.id;
          evt.startDate = fromUnixTime(evt.startDate);
          evt.endDate = fromUnixTime(evt.endDate);

          return evt;
        });
      });
  }
}
