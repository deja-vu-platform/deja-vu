import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';


interface DeleteResourceRes {
  data: {deleteResource: boolean};
}

@Component({
  selector: 'allocator-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnChanges, OnRun {
  @Input() resourceId: string;
  @Input() allocationId: string;
  resourceIdChange = new EventEmitter();
  allocationIdChange = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

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
      .post<DeleteResourceRes>(this.apiPath, {
        query: `
          mutation DeleteResource($input: DeleteResourceInput!) {
            deleteResource(input: $input)
          }
        `,
        variables: {
          input: {
            resourceId: this.resourceId,
            allocationId: this.allocationId
          }
        }
      })
      .toPromise();
  }
}
