import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnExec,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Event } from '../../../../shared/data';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'event-create-series',
  templateUrl: './create-series.component.html',
  styleUrls: ['./create-series.component.css']
})
export class CreateSeriesComponent implements OnExec, OnInit {
  @Input() id: string | undefined = '';
  @Input() seriesEvents: Event[] = [];
  @Input() seriesEventsIds: string[] = [];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation CreateSeries($input: CreateSeriesInput!) {
          createSeries(input: $input) {
            id
          }
        }`,
        variables: {
          input: {
            id: this.id,
            events: _.zipWith(
              this.seriesEvents, this.seriesEventsIds, (evt, id) => {
              evt.id = id;

              return evt;
            })
          }
        }
      })
     .toPromise();
  }
}
