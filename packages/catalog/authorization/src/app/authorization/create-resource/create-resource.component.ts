import {
  Component, ElementRef, EventEmitter,
  Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../../../../shared/authorization.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  // Presentation Inputs
  @Input() id: string;
  @Input() ownerId: string;
  @Input() viewerIds?: string;
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
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{
        data: {
          createResource:
          { id: string, ownerId: string, viewerIds: string[] }
        }
      }>('/graphql', {
          query: `mutation CreateResource($input: CreateResourceInput!){
            createResource(input: $input) {
              id,
              owner { id },
              viewers { id }
            }
          }`,
          variables: {
            input: {
              id: this.id,
              ownerId: this.ownerId,
              viewerIds: this.viewerIds
            }
          }
        })
      .toPromise();
    this.resource.emit({
      id: res.data.createResource.id,
      ownerId: res.data.createResource.ownerId,
      viewerIds: res.data.createResource.viewerIds
    });
  }

  dvOnAfterCommit() {
    this.newResourceSuccess = true;
    window.setTimeout(() => {
      this.newResourceSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newResourceErrorText = reason.message;
  }
}
