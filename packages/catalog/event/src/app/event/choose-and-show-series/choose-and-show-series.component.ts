import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory
} from '@deja-vu/core';
import * as _ from 'lodash';

import { map } from 'rxjs/operators';

import {
  Event, GraphQlEvent, GraphQlSeries, Series, toEvent, toSeries
} from '../../../../shared/data';

import { ShowEventComponent } from '../show-event/show-event.component';


interface SeriesRes {
  data: { series: GraphQlSeries[] };
}

interface OneSeriesRes {
  data: {
    oneSeries: { events: GraphQlEvent[] }
  };
}


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

  @Input() showEvent: ComponentValue = {
    type: <Type<Component>> ShowEventComponent
  };

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
        .get<SeriesRes>('/graphql', {
          params: {
            extraInfo: {
              action: 'all-series',
              returnFields: `
                id
                startsOn
                endsOn
              `
            }
          }
        })
        .pipe(map((res: SeriesRes) => res.data.series))
        .subscribe((series: GraphQlSeries[]) => {
          this.series = _.map(series, toSeries);
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
      .get<OneSeriesRes>('/graphql', {
        params: {
          inputs: { id: selectedSeries.id },
          extraInfo: {
            action: 'one-series',
            returnFields: `
              events {
                id
                startDate
                endDate
                series { id }
              }
            `
          }
        }
      })
      .pipe(map((res: OneSeriesRes) => res.data.oneSeries.events))
      .subscribe((events: GraphQlEvent[]) => {
        this.events = _.map(events, toEvent);
      });
  }
}
