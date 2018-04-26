import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';


interface CreateAllocationRes {
  data: {createAllocation: {id: string}};
}

@Component({
  selector: 'allocator-create-allocation',
  templateUrl: './create-allocation.component.html'
})
export class CreateAllocationComponent implements OnInit, OnChanges, OnRun {
  @Input() id: string;
  @Input() resourceIds: string[]; // Required
  @Input() consumerIds: string[]; // Required

  @Input() buttonLabel = 'Create Allocation';

  @Output() allocation = new EventEmitter();

  resourceIdsChange = new EventEmitter();
  consumerIdsChange = new EventEmitter();

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
    if (changes.resourceIds) {
      this.resourceIdsChange.emit(null);
    }
    if (changes.consumerIds) {
      this.consumerIdsChange.emit(null);
    }
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun() {
    if (this.resourceIds === undefined) {
      await this.resourceIdsChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    if (this.consumerIds === undefined) {
      await this.consumerIdsChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    console.log(`Create allocation with ${this.id}`);
    this.gs.post<CreateAllocationRes>(this.apiPath, {
      query: `
        mutation CreateAllocation(
          $id: ID!, $resourceIds: [ID!], $consumerIds: [ID!]) {
          createAllocation(
            id: $id, resourceIds: $resourceIds,
            consumerIds: $consumerIds) {
            id
          }
        }
      `,
      variables: {
        id: this.id,
        resourceIds: this.resourceIds,
        consumerIds: this.consumerIds
      }
    })
    .pipe(map((res) => res.data.createAllocation))
    .subscribe((allocation) => {
      this.allocation.emit({ id: allocation.id });
    });
  }
}
