import {
  AfterViewInit, Component, ElementRef, Input, OnInit
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnExec, OnExecSuccess
} from '@deja-vu/core';
import { Event } from '../../../../shared/data';

import * as _ from 'lodash';


@Component({
  selector: 'event-delete-event',
  templateUrl: './delete-event.component.html',
  styleUrls: ['./delete-event.component.css']
})
export class DeleteEventComponent implements OnInit, OnExec, OnExecSuccess {
  @Input() id;
  // Optional list of events to delete itself from after exec success
  @Input() events: Event[];
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  async dvOnExec() {
    await this.dvs.post('/graphql', {
      inputs: { id: this.id }
    });
  }

  dvOnExecSuccess() {
    _.remove(this.events, (evt: Event) => evt.id === this.id);
  }

  deleteEvent() {
    this.dvs.exec();
  }
}
