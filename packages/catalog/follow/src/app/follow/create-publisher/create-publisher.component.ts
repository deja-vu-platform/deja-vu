import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output
} from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

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
  OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Publisher';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Publisher Id';
  @Input() newPublisherSavedText = 'New publisher saved';

  @Output() publisher: EventEmitter<Publisher> = new EventEmitter<Publisher>();

  newPublisherSaved = false;
  newPublisherError: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<CreatePublisherRes>(this.apiPath, {
      inputs: { id: this.id },
      extraInfo: { returnFields: 'id' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.publisher.emit({ id: res.data.createPublisher.id });
  }

  dvOnExecSuccess() {
    this.newPublisherSaved = true;
    this.newPublisherError = '';
    window.setTimeout(() => {
      this.newPublisherSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnExecFailure(reason: Error) {
    this.newPublisherError = reason.message;
  }
}
