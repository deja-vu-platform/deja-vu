import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExecAbort,
  OnExecCommit, OnExec, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';


interface CreateResourceRes {
 data: { createResource: Resource; };
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent implements
  OnInit, OnExec, OnExecCommit, OnExecAbort {
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

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const resource: Resource = {
      id: this.id,
      ownerId: this.ownerId,
      viewerIds: this.viewerIds
    };
    if (this.save) {
      const res = await this.gs.post<CreateResourceRes>(this.apiPath, {
        query: `
          mutation CreateResource($input: CreateResourceInput!) {
            createResource(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: resource
        }
      })
      .toPromise();
    }
    this.resource.emit(resource);
  }

  dvOnExecCommit() {
    this.newResourceSuccess = true;
    window.setTimeout(() => {
      this.newResourceSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecAbort(reason: Error) {
    this.newResourceErrorText = reason.message;
  }
}
