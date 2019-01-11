import {
  AfterViewInit, Component, ElementRef, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecSuccess, RunService
} from 'dv-core';
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
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  dvOnExec() {
    this.gs
      .post('/graphql', {
        inputs: { id: this.id }
      })
      .toPromise();
  }

  dvOnExecSuccess() {
    _.remove(this.events, (evt: Event) => evt.id === this.id);
  }

  deleteEvent() {
    this.rs.exec(this.elem);
  }
}
