import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import {
  AllocatorService, AllocatorServiceFactory
} from '../shared/allocator.service';

import { OnRun, RunService } from 'dv-core';
import { take } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'allocator-create-allocation',
  templateUrl: './create-allocation.component.html'
})
export class CreateAllocationComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() resources: [{id: string}]; // Required
  @Input() saveResources = false;

  @Input() buttonLabel = 'Create Allocation';

  @Output() allocation = new EventEmitter();

  resourcesChange = new EventEmitter();

  private allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.resources || changes.newResources) {
      this.resourcesChange.emit(null);
    }
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun() {
    if (this.resources === undefined) {
      await this.resourcesChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    console.log(`Create allocation with ${this.id}`);
    const resourceIds = _.map(this.resources, 'id');
    this.allocator
      .createAllocation(this.id, resourceIds, this.saveResources)
      .subscribe((allocation) => {
        this.allocation.emit({id: allocation.id});
      });
  }
}
