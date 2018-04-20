import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Publisher } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'follow-create-publisher',
  templateUrl: './create-publisher.component.html',
  styleUrls: ['./create-publisher.component.css']
})
export class CreatePublisherComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Publisher';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Publisher Id';
  @Input() newPublisherSavedText = 'New publisher saved';

  @Output() publisher: EventEmitter<Publisher> = new EventEmitter<Publisher>();

  newPublisherSaved = false;
  newPublisherError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createPublisher: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
          createPublisher(id: "${this.id}") {
            id
          }
        }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.publisher.emit({ id: res.data.createPublisher.id });
  }

  dvOnAfterCommit() {
    this.newPublisherSaved = true;
    this.newPublisherError = '';
    window.setTimeout(() => {
      this.newPublisherSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newPublisherError = reason.message;
  }
}
