import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

interface DeleteResourceRes {
  data: {deleteResource: boolean};
}

const GRAPHQL_ENDPOINT = '/graphql';

@Component({
  selector: 'allocator-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnChanges {
  @Input() resourceId: string;
  @Input() allocationId: string;
  resourceIdChange = new EventEmitter();
  allocationIdChange = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceId) {
      this.resourceIdChange.emit();
    }
    if (changes.allocationId) {
      this.allocationIdChange.emit();
    }
  }

  async dvOnRun(): Promise<any> {
    if (this.resourceId === undefined) {
      await this.resourceIdChange.asObservable()
        .toPromise();
    }
    if (this.allocationId === undefined) {
      await this.allocationIdChange.asObservable()
        .toPromise();
    }

    return this.gs
      .post<DeleteResourceRes>(GRAPHQL_ENDPOINT, {
        query: `
          mutation DeleteResource($resourceId: ID!, $allocationId: ID!) {
            deleteResource(resourceId: $resourceId, allocationId: $allocationId)
          }
        `,
        variables: {
          resourceId: this.resourceId,
          allocationId: this.allocationId
        }
      })
      .toPromise();
  }
}
