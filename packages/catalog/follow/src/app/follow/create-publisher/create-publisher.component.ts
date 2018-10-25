import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExecAbort, OnExecCommit,
  OnExec, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { API_PATH } from '../follow.config';
import { Publisher } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

interface CreatePublisherRes {
  data: { createPublisher: Publisher };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-create-publisher',
  templateUrl: './create-publisher.component.html',
  styleUrls: ['./create-publisher.component.css']
})
export class CreatePublisherComponent implements
  OnInit, OnExec, OnExecAbort, OnExecCommit {
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
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreatePublisherRes>(this.apiPath, {
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

  dvOnExecCommit() {
    this.newPublisherSaved = true;
    this.newPublisherError = '';
    window.setTimeout(() => {
      this.newPublisherSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnExecAbort(reason: Error) {
    this.newPublisherError = reason.message;
  }
}
