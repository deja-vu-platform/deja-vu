import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';
import { ComponentValue, DvService, DvServiceFactory } from '@deja-vu/core';
import * as _ from 'lodash';

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
  private dvs: DvService;

  constructor(private elem: ElementRef, private dvf: DvServiceFactory) {
    this.chooseAndShowSeries = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  // TODO: should instead make this reactive with Apollo
  async maybeFetchEvents(toggle: boolean) {
    if (toggle) {
      const res = await this.dvs
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
        });
        this.series = _.map(res.data.series, toSeries);
    }
  }

  async updateEvents(selectedSeries: Series) {
    this.selectedSeries = selectedSeries;
    this.events = [];
    if (!selectedSeries) {
      return;
    }
    const res = await this.dvs
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
      });
      this.events = _.map(res.data.oneSeries.events, toEvent);
  }
}
