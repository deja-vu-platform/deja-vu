import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

import * as _ from 'lodash';


interface CreateResourceRes {
  data: { createResource: Resource; };
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent
  implements OnInit, OnChanges, OnExec, OnExecSuccess, OnExecFailure {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];

  @Input() id: string;
  @Input() ownerId: string;
  @Input() viewerIds?: string[];

  @Input()
  set viewers(value: { id: string }[]) {
    this.viewerIds = _.map(value, 'id');
  }

  @Input() save = true;
  // Presentation Inputs
  @Input() buttonLabel = 'Create Resource';
  @Input() resourceInputLabel = 'Id';
  @Input() ownerInputLabel = 'Owner Id';
  @Input() viewerInputLabel = 'Viewer Id';
  @Input() newResourceSuccessText = 'New resource created';

  @Output() resource = new EventEmitter();

  newResourceSuccess = false;
  newResourceErrorText: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    await this.dvs.waiter.maybeWait();
    const resource: Resource = {
      id: this.id,
      ownerId: this.ownerId,
      viewerIds: this.viewerIds
    };
    if (this.save) {
      const res = await this.dvs.post<CreateResourceRes>(this.apiPath, {
        inputs: { input: resource },
        extraInfo: { returnFields: 'id' }
      });
    } else {
      this.dvs.noRequest();
    }
    this.resource.emit(resource);
  }

  dvOnExecSuccess() {
    this.newResourceSuccess = true;
    window.setTimeout(() => {
      this.newResourceSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.newResourceErrorText = reason.message;
  }
}
