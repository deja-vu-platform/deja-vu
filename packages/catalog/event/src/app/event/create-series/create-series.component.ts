import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  async dvOnExec(): Promise<void> {
    await this.dvs.post<{data: any}>('/graphql', {
      inputs: {
        input: {
          id: this.id,
          events: _.zipWith(
            this.seriesEvents, this.seriesEventsIds, (evt, id) => {
            evt.id = id;

            return evt;
          })
        }
      },
      extraInfo: { returnFields: 'id' }
    });
  }
}
