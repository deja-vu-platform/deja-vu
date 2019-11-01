import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';

import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';


export interface CreateAllocationRes {
  data: { createAllocation: { id: string } };
}

@Component({
  selector: 'allocator-create-allocation',
  templateUrl: './create-allocation.component.html'
})
export class CreateAllocationComponent implements OnInit, OnChanges, OnExec {
  @Input() waitOn: string[];
  @Input() id: string | undefined;
  @Input() resourceIds: string[];
  @Input() consumerIds: string[];

  @Input() buttonLabel = 'Create Allocation';

  @Output() allocation = new EventEmitter();

  resourceIdsChange = new EventEmitter();
  consumerIdsChange = new EventEmitter();

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

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

  async dvOnExec() {
    const res = await this.dvs.waitAndPost<CreateAllocationRes>(this.apiPath,
      () => ({
        inputs: {
          input: {
            id: this.id,
            resourceIds: this.resourceIds,
            consumerIds: this.consumerIds
          }
        },
        extraInfo: { returnFields: 'id' }
      }));
    this.allocation.emit({ id: res.data.createAllocation.id });
  }
}
